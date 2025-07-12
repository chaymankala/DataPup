import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Flex,
  Text,
  Select,
  TextField,
  Table,
  Badge,
  Checkbox,
  DropdownMenu,
  ContextMenu
} from '@radix-ui/themes'
import {
  PlusCircledIcon,
  TrashIcon,
  DownloadIcon,
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MixerHorizontalIcon
} from '@radix-ui/react-icons'
import { Skeleton } from '../ui'
import { TableFilter } from '../../types/tabs'
import { exportToCSV, exportToJSON } from '../../utils/exportData'
import './TableView.css'
import { v4 as uuidv4 } from 'uuid'

interface TableViewProps {
  connectionId: string
  database: string
  tableName: string
  onFiltersChange: (filters: TableFilter[]) => void
}

interface Column {
  name: string
  type: string
}

interface QueryResult {
  success: boolean
  data?: any[]
  message: string
  error?: string
  executionTime?: number
}

const OPERATORS = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: '>=', label: 'greater or equal' },
  { value: '<=', label: 'less or equal' },
  { value: 'LIKE', label: 'contains' },
  { value: 'NOT LIKE', label: 'not contains' },
  { value: 'IS NULL', label: 'is null' },
  { value: 'IS NOT NULL', label: 'is not null' }
]

export function TableView({ connectionId, database, tableName, onFiltersChange }: TableViewProps) {
  const [columns, setColumns] = useState<Column[]>([])
  const [filters, setFilters] = useState<TableFilter[]>([])
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSchema, setIsLoadingSchema] = useState(true)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [editedCells, setEditedCells] = useState<Map<string, any>>(new Map())
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null)
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' }[]>([])
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set())
  const [clonedRows, setClonedRows] = useState<Map<number, any>>(new Map())
  const inputRef = useRef<HTMLInputElement>(null)

  // Load table schema on mount
  useEffect(() => {
    loadTableSchema()
  }, [connectionId, database, tableName])

  // Execute query when component mounts or filters change
  useEffect(() => {
    executeQuery()
  }, [connectionId, database, tableName])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected rows when Delete key is pressed
      if (e.key === 'Delete' && selectedRows.size > 0 && !isReadOnly && !editingCell) {
        e.preventDefault()
        selectedRows.forEach((rowIndex) => markRowForDeletion(rowIndex))
      }

      // Clone selected row when Ctrl/Cmd+D is pressed
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'd' &&
        selectedRows.size === 1 &&
        !isReadOnly &&
        !editingCell
      ) {
        e.preventDefault()
        const selectedRow = Array.from(selectedRows)[0]
        cloneRow(selectedRow)
      }

      // Apply changes when Ctrl/Cmd+S is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !isReadOnly) {
        e.preventDefault()
        if (editedCells.size > 0 || deletedRows.size > 0 || clonedRows.size > 0) {
          handleApplyChanges()
        }
      }

      // Select all rows when Ctrl/Cmd+A is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !editingCell) {
        e.preventDefault()
        const allIndices = new Set(result?.data?.map((_, i) => i) || [])
        setSelectedRows(allIndices)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedRows, isReadOnly, editingCell, result, editedCells, deletedRows, clonedRows])

  // Check if connection is read-only
  useEffect(() => {
    const checkReadOnly = async () => {
      try {
        const response = await window.api.database.isReadOnly(connectionId)
        setIsReadOnly(response.isReadOnly || false)
      } catch (error) {
        console.error('Error checking read-only status:', error)
        setIsReadOnly(false)
      }
    }
    checkReadOnly()
  }, [connectionId])

  const loadTableSchema = async () => {
    try {
      setIsLoadingSchema(true)
      const schemaResult = await window.api.database.getTableSchema(
        connectionId,
        tableName,
        database
      )
      if (schemaResult.success && schemaResult.schema) {
        const cols: Column[] = schemaResult.schema.map((col: any) => ({
          name: col.name,
          type: col.type
        }))
        setColumns(cols)
      }
    } catch (error) {
      console.error('Error loading table schema:', error)
    } finally {
      setIsLoadingSchema(false)
    }
  }

  const buildQuery = () => {
    let query = `SELECT * FROM ${database}.${tableName}`

    const validFilters = filters.filter(
      (f) =>
        f.column &&
        f.operator &&
        (f.value || f.operator === 'IS NULL' || f.operator === 'IS NOT NULL')
    )

    if (validFilters.length > 0) {
      const whereClauses = validFilters.map((filter) => {
        if (filter.operator === 'IS NULL' || filter.operator === 'IS NOT NULL') {
          return `${filter.column} ${filter.operator}`
        } else if (filter.operator === 'LIKE' || filter.operator === 'NOT LIKE') {
          return `${filter.column} ${filter.operator} '%${filter.value}%'`
        } else {
          // Check if value is numeric
          const isNumeric = !isNaN(Number(filter.value))
          return `${filter.column} ${filter.operator} ${isNumeric ? filter.value : `'${filter.value}'`}`
        }
      })
      query += ` WHERE ${whereClauses.join(' AND ')}`
    }

    query += ' LIMIT 1000'
    return query
  }

  const executeQuery = async () => {
    try {
      setIsLoading(true)
      const startTime = Date.now()
      const query = buildQuery()

      const sessionId = uuidv4()
      const queryResult = await window.api.database.query(connectionId, query, sessionId)
      const executionTime = Date.now() - startTime

      setResult({
        ...queryResult,
        executionTime
      })
    } catch (error) {
      console.error('Query execution error:', error)
      setResult({
        success: false,
        message: 'Query execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addFilter = () => {
    const newFilter: TableFilter = {
      id: Date.now().toString(),
      column: columns[0]?.name || '',
      operator: '=',
      value: ''
    }
    const newFilters = [...filters, newFilter]
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const updateFilter = (id: string, updates: Partial<TableFilter>) => {
    const newFilters = filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const removeFilter = (id: string) => {
    const newFilters = filters.filter((f) => f.id !== id)
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const toggleRowSelection = (index: number, event?: React.MouseEvent) => {
    const newSelected = new Set(selectedRows)

    // If shift key is held, select range
    if (event?.shiftKey && selectedRows.size > 0) {
      const lastSelected = Array.from(selectedRows).pop()!
      const start = Math.min(lastSelected, index)
      const end = Math.max(lastSelected, index)
      for (let i = start; i <= end; i++) {
        newSelected.add(i)
      }
    } else if (event?.ctrlKey || event?.metaKey) {
      // Toggle individual selection
      if (newSelected.has(index)) {
        newSelected.delete(index)
      } else {
        newSelected.add(index)
      }
    } else {
      // Single selection
      newSelected.clear()
      newSelected.add(index)
    }

    setSelectedRows(newSelected)
  }

  const markRowForDeletion = (index: number) => {
    const newDeleted = new Set(deletedRows)
    newDeleted.add(index)
    setDeletedRows(newDeleted)
  }

  const cloneRow = (index: number) => {
    if (!result?.data?.[index]) return

    const originalRow = result.data[index]
    const clonedRow = { ...originalRow }

    // Add the cloned row to the clonedRows map with a new index
    const newIndex = result.data.length + clonedRows.size
    setClonedRows(new Map(clonedRows).set(newIndex, clonedRow))

    // Mark all cells in the cloned row as edited for insert operation
    columns.forEach((col) => {
      const key = `${newIndex}-${col.name}`
      setEditedCells((prev) => new Map(prev).set(key, clonedRow[col.name]))
    })
  }

  const handleCellEdit = (rowIndex: number, column: string, value: any) => {
    const key = `${rowIndex}-${column}`
    const originalValue = result?.data?.[rowIndex]?.[column]

    if (value === originalValue) {
      // Remove from edited cells if value is reverted to original
      const newEdited = new Map(editedCells)
      newEdited.delete(key)
      setEditedCells(newEdited)
    } else {
      setEditedCells(new Map(editedCells).set(key, value))
    }
  }

  const handleStartEdit = (rowIndex: number, column: string) => {
    if (isReadOnly) return
    setEditingCell({ rowIndex, column })
    // Focus input on next render
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleEndEdit = () => {
    setEditingCell(null)
  }

  const handleApplyChanges = async () => {
    if (editedCells.size === 0 && deletedRows.size === 0 && clonedRows.size === 0) return

    try {
      setIsLoading(true)

      // Get primary key information for the table
      const schemaResult = await window.api.database.getTableFullSchema(
        connectionId,
        tableName,
        database
      )

      if (!schemaResult.success || !schemaResult.schema) {
        alert('Failed to get table schema')
        return
      }

      const primaryKeys = schemaResult.schema.primaryKeys

      // Group changes by row
      const changesByRow = new Map<number, Record<string, any>>()
      const newRows: number[] = []

      editedCells.forEach((value, key) => {
        const [rowIndex, column] = key.split('-')
        const index = parseInt(rowIndex)

        if (!changesByRow.has(index)) {
          changesByRow.set(index, {})
        }
        changesByRow.get(index)![column] = value
      })

      // Process each row
      const promises: Promise<any>[] = []

      // Handle deletions first
      if (deletedRows.size > 0 && primaryKeys.length > 0) {
        for (const rowIndex of deletedRows) {
          const row = result?.data?.[rowIndex]
          if (row) {
            const primaryKeyValues: Record<string, any> = {}
            primaryKeys.forEach((pk) => {
              primaryKeyValues[pk] = row[pk]
            })
            promises.push(
              window.api.database.deleteRow(connectionId, tableName, primaryKeyValues, database)
            )
          }
        }
      }

      // Handle updates and inserts (including cloned rows)
      for (const [rowIndex, changes] of changesByRow.entries()) {
        // Skip if row is marked for deletion
        if (deletedRows.has(rowIndex)) continue

        const originalRow = result?.data?.[rowIndex] || clonedRows.get(rowIndex)

        // Check if this is a new row (including cloned rows)
        const isNewRow =
          clonedRows.has(rowIndex) ||
          (Object.keys(changes).length === columns.length &&
            columns.every((col) => editedCells.has(`${rowIndex}-${col.name}`)))

        if (isNewRow) {
          // Insert new row
          promises.push(window.api.database.insertRow(connectionId, tableName, changes, database))
        } else if (originalRow) {
          // Update existing row
          if (primaryKeys.length === 0) {
            alert('Cannot update: Table has no primary keys defined')
            continue
          }

          const primaryKeyValues: Record<string, any> = {}
          primaryKeys.forEach((pk) => {
            primaryKeyValues[pk] = originalRow[pk]
          })

          promises.push(
            window.api.database.updateRow(
              connectionId,
              tableName,
              primaryKeyValues,
              changes,
              database
            )
          )
        }
      }

      const results = await Promise.all(promises)
      const failures = results.filter((r) => !r.success)

      if (failures.length > 0) {
        alert(`Failed to save ${failures.length} change(s)`)
      } else {
        // Clear all pending changes after successful update
        setEditedCells(new Map())
        setDeletedRows(new Set())
        setClonedRows(new Map())
      }

      // Refresh the table data
      await executeQuery()
    } catch (error) {
      console.error('Error applying changes:', error)
      alert(
        'Failed to apply changes: ' + (error instanceof Error ? error.message : 'Unknown error')
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (selectedRows.size === 0 || !result?.data) return

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedRows.size} row(s)?`
    )
    if (!confirmDelete) return

    try {
      setIsLoading(true)

      // Get primary key information for the table
      const schemaResult = await window.api.database.getTableFullSchema(
        connectionId,
        tableName,
        database
      )

      if (!schemaResult.success || !schemaResult.schema) {
        alert('Failed to get table schema for delete operation')
        return
      }

      const primaryKeys = schemaResult.schema.primaryKeys
      if (primaryKeys.length === 0) {
        alert('Cannot delete: Table has no primary keys defined')
        return
      }

      // Delete each selected row
      const deletePromises = Array.from(selectedRows).map(async (rowIndex) => {
        const row = result.data![rowIndex]
        const primaryKeyValues: Record<string, any> = {}

        primaryKeys.forEach((pk) => {
          primaryKeyValues[pk] = row[pk]
        })

        return window.api.database.deleteRow(connectionId, tableName, primaryKeyValues, database)
      })

      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter((r) => !r.success)

      if (failedDeletes.length > 0) {
        alert(`Failed to delete ${failedDeletes.length} row(s)`)
      } else {
        // Clear selection after successful delete
        setSelectedRows(new Set())
      }

      // Refresh the table data
      await executeQuery()
    } catch (error) {
      console.error('Error deleting rows:', error)
      alert('Failed to delete rows: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRow = () => {
    if (!result?.data) return

    // Create a new empty row with default values
    const newRow: Record<string, any> = {}
    columns.forEach((col) => {
      newRow[col.name] = col.default || ''
    })

    // Add the new row to the data
    const newData = [newRow, ...result.data]
    setResult({
      ...result,
      data: newData
    })

    // Mark all cells in the new row as edited
    columns.forEach((col) => {
      const key = `0-${col.name}`
      setEditedCells((prev) => new Map(prev).set(key, newRow[col.name]))
    })

    // Optionally, start editing the first cell
    if (columns.length > 0) {
      setTimeout(() => {
        handleStartEdit(0, columns[0].name)
      }, 100)
    }
  }

  const handleSort = (column: string) => {
    const existingSort = sortConfig.find((s) => s.column === column)
    let newSortConfig: typeof sortConfig

    if (!existingSort) {
      newSortConfig = [{ column, direction: 'asc' }]
    } else if (existingSort.direction === 'asc') {
      newSortConfig = [{ column, direction: 'desc' }]
    } else {
      newSortConfig = sortConfig.filter((s) => s.column !== column)
    }

    setSortConfig(newSortConfig)
    // TODO: Apply sorting to query
  }

  const formatResult = (data: any[], result?: QueryExecutionResult) => {
    if (!data || data.length === 0) {
      // Check if this is a successful DDL/DML command
      if (result?.isDDL || result?.isDML) {
        return (
          <Flex align="center" justify="center" height="100%" p="4">
            <Text color="green" size="2" weight="medium">
              ✓ {result.message}
            </Text>
          </Flex>
        )
      }
      return <Text color="gray">No data returned</Text>
    }

    const columns = Object.keys(data[0])
    const allData = [...data, ...Array.from(clonedRows.values())]

    const renderCell = (rowIndex: number, column: string, value: any) => {
      const key = `${rowIndex}-${column}`
      const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.column === column
      const isEdited = editedCells.has(key)
      const displayValue = isEdited ? editedCells.get(key) : value

      if (isReadOnly) {
        return (
          <Text size="1">
            {displayValue !== null && displayValue !== undefined ? (
              String(displayValue)
            ) : (
              <Text size="1" color="gray">
                null
              </Text>
            )}
          </Text>
        )
      }

      if (isEditing) {
        return (
          <TextField.Root
            ref={inputRef}
            size="1"
            value={displayValue ?? ''}
            onChange={(e) => handleCellEdit(rowIndex, column, e.target.value)}
            onBlur={handleEndEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEndEdit()
              if (e.key === 'Escape') {
                handleCellEdit(rowIndex, column, value)
                handleEndEdit()
              }
            }}
            style={{ width: '100%' }}
          />
        )
      }

      return (
        <Box
          onDoubleClick={() => handleStartEdit(rowIndex, column)}
          style={{
            cursor: 'text',
            padding: '2px',
            borderRadius: '2px',
            backgroundColor: isEdited ? 'var(--accent-a4)' : 'transparent',
            width: '100%',
            minHeight: '20px'
          }}
        >
          <Text size="1">
            {displayValue !== null && displayValue !== undefined ? (
              String(displayValue)
            ) : (
              <Text size="1" color="gray">
                null
              </Text>
            )}
          </Text>
        </Box>
      )
    }

    return (
      <Table.Root size="1">
        <Table.Header>
          <Table.Row>
            {!isReadOnly && (
              <Table.ColumnHeaderCell width="50px" style={{ textAlign: 'center' }}>
                <Text size="1" weight="medium">
                  #
                </Text>
              </Table.ColumnHeaderCell>
            )}
            {columns.map((column) => {
              const sortInfo = sortConfig.find((s) => s.column === column)
              return (
                <Table.ColumnHeaderCell
                  key={column}
                  onClick={() => handleSort(column)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <Flex align="center" gap="1">
                    <Text size="1" weight="medium">
                      {column}
                    </Text>
                    {sortInfo &&
                      (sortInfo.direction === 'asc' ? (
                        <ChevronUpIcon width={12} height={12} />
                      ) : (
                        <ChevronDownIcon width={12} height={12} />
                      ))}
                  </Flex>
                </Table.ColumnHeaderCell>
              )
            })}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {allData.map((row, rowIndex) => {
            const isDeleted = deletedRows.has(rowIndex)
            const isCloned = clonedRows.has(rowIndex)
            const isSelected = selectedRows.has(rowIndex)

            // Check if row has any edits
            const hasEdits = Array.from(editedCells.keys()).some((key) => {
              const [editRowIndex] = key.split('-')
              return parseInt(editRowIndex) === rowIndex && !isCloned
            })

            return (
              <ContextMenu.Root key={rowIndex}>
                <ContextMenu.Trigger>
                  <Table.Row
                    style={{
                      opacity: isDeleted ? 0.6 : 1,
                      backgroundColor: isDeleted
                        ? 'var(--red-a3)'
                        : hasEdits
                          ? 'var(--accent-a2)'
                          : isSelected
                            ? 'var(--accent-a3)'
                            : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {!isReadOnly && (
                      <Table.Cell
                        onClick={(e) => toggleRowSelection(rowIndex, e)}
                        style={{
                          textAlign: 'center',
                          cursor: 'pointer',
                          userSelect: 'none',
                          fontWeight: isSelected ? 'bold' : 'normal'
                        }}
                      >
                        <Text size="1" color={isDeleted ? 'red' : isCloned ? 'green' : undefined}>
                          {rowIndex + 1}
                        </Text>
                      </Table.Cell>
                    )}
                    {columns.map((column) => (
                      <Table.Cell key={column}>
                        {renderCell(rowIndex, column, row[column])}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                </ContextMenu.Trigger>
                <ContextMenu.Content size="1">
                  <ContextMenu.Item onClick={() => cloneRow(rowIndex)} disabled={isDeleted}>
                    Clone Row
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    onClick={() => markRowForDeletion(rowIndex)}
                    disabled={isDeleted || isCloned}
                    color="red"
                  >
                    Delete Row
                  </ContextMenu.Item>
                  <ContextMenu.Separator />
                  <ContextMenu.Item onClick={() => handleStartEdit(rowIndex, columns[0])}>
                    Edit Row
                  </ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu.Root>
            )
          })}
        </Table.Body>
      </Table.Root>
    )
  }

  return (
    <Box className="table-view">
      <Flex direction="column" height="100%">
        {/* Filters Section */}
        <Box className="filters-section">
          <Flex justify="between" align="center" p="1" className="filter-header">
            <Text size="1" weight="medium">
              Filters
            </Text>
            <Flex gap="1">
              <Button
                size="1"
                variant="outline"
                onClick={addFilter}
                disabled={isLoadingSchema}
                title="Add filter"
              >
                <MixerHorizontalIcon />
                Filter
              </Button>
              <Button size="1" onClick={executeQuery} disabled={isLoading} title="Apply filters">
                <CheckIcon />
              </Button>
            </Flex>
          </Flex>
          <Box px="1" py="1">
            {filters.map((filter, index) => (
              <Flex
                key={filter.id}
                gap="1"
                align="center"
                mb={index < filters.length - 1 ? '1' : '0'}
              >
                <Select.Root
                  value={filter.column}
                  onValueChange={(value) => updateFilter(filter.id, { column: value })}
                  disabled={isLoadingSchema}
                >
                  <Select.Trigger placeholder="Select column" className="filter-select" size="1" />
                  <Select.Content>
                    {columns.map((col) => (
                      <Select.Item key={col.name} value={col.name}>
                        <Text size="1">{col.name}</Text>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                <Select.Root
                  value={filter.operator}
                  onValueChange={(value) => updateFilter(filter.id, { operator: value as any })}
                >
                  <Select.Trigger className="filter-select" size="1" />
                  <Select.Content>
                    {OPERATORS.map((op) => (
                      <Select.Item key={op.value} value={op.value}>
                        <Text size="1">{op.label}</Text>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                {filter.operator !== 'IS NULL' && filter.operator !== 'IS NOT NULL' && (
                  <TextField.Root
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="Value"
                    className="filter-input"
                    size="1"
                  />
                )}

                <Button
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => removeFilter(filter.id)}
                  style={{ padding: '0 4px', minWidth: '20px', height: '20px' }}
                >
                  ×
                </Button>
              </Flex>
            ))}
          </Box>
        </Box>

        {/* Results Section */}
        <Box className="results-section" flex="1">
          <Flex justify="between" align="center" p="2" className="results-header">
            <Flex align="center" gap="3">
              <Text size="2" weight="medium">
                Results
              </Text>
              {result?.success && result.data && (
                <>
                  <Badge size="1" variant="soft">
                    {result.data.length} rows
                  </Badge>
                  {result.executionTime && (
                    <Badge size="1" variant="soft" color="gray">
                      {result.executionTime}ms
                    </Badge>
                  )}
                  {selectedRows.size > 0 && (
                    <Badge size="1" variant="soft" color="blue">
                      {selectedRows.size} selected
                    </Badge>
                  )}
                  {deletedRows.size > 0 && (
                    <Badge size="1" variant="soft">
                      {deletedRows.size} to delete
                    </Badge>
                  )}
                  {clonedRows.size > 0 && (
                    <Badge size="1" variant="soft">
                      {clonedRows.size} to insert
                    </Badge>
                  )}
                  {(() => {
                    // Count edited rows (excluding cloned rows which are inserts)
                    const editedRowsSet = new Set<number>()
                    editedCells.forEach((_, key) => {
                      const rowIndex = parseInt(key.split('-')[0])
                      if (!clonedRows.has(rowIndex)) {
                        editedRowsSet.add(rowIndex)
                      }
                    })
                    return editedRowsSet.size > 0 ? (
                      <Badge size="1" variant="soft">
                        {editedRowsSet.size} to update
                      </Badge>
                    ) : null
                  })()}
                </>
              )}
            </Flex>

            <Flex gap="1" align="center">
              {!isReadOnly && result?.success && result.data && (
                <>
                  <Button
                    size="1"
                    variant="soft"
                    onClick={handleAddRow}
                    disabled={isLoading}
                    title="Add new row"
                    style={{ cursor: 'pointer' }}
                  >
                    <PlusCircledIcon />
                  </Button>
                  {(editedCells.size > 0 || deletedRows.size > 0 || clonedRows.size > 0) && (
                    <Button
                      size="1"
                      variant="solid"
                      onClick={handleApplyChanges}
                      disabled={isLoading}
                      title="Apply all pending changes"
                    >
                      <CheckIcon />
                      Apply Changes ({editedCells.size + deletedRows.size + clonedRows.size})
                    </Button>
                  )}
                </>
              )}
              {result?.success && result.data && result.data.length > 0 && (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button
                      size="1"
                      variant="soft"
                      title="Export data"
                      style={{ cursor: 'pointer' }}
                    >
                      <DownloadIcon />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item
                      onClick={() => exportToCSV(result.data || [], `${tableName}-export.csv`)}
                    >
                      Export as CSV
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={() => exportToJSON(result.data || [], `${tableName}-export.json`)}
                    >
                      Export as JSON
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              )}
            </Flex>
          </Flex>

          <Box className="results-content">
            {isLoading ? (
              <Flex direction="column" gap="2" p="4">
                <Skeleton height={32} />
                <Skeleton height={32} />
                <Skeleton height={32} />
              </Flex>
            ) : result ? (
              result.success ? (
                <Box className="result-table-container">
                  {formatResult(result.data || [], result)}
                </Box>
              ) : (
                <Flex align="center" justify="center" height="100%" p="4">
                  <Box className="error-message">
                    <Text size="2" color="red" weight="medium">
                      {result.message}
                    </Text>
                    {result.error && (
                      <Text size="1" color="red" mt="1" style={{ display: 'block' }}>
                        {result.error}
                      </Text>
                    )}
                  </Box>
                </Flex>
              )
            ) : (
              <Flex align="center" justify="center" height="100%">
                <Text color="gray" size="1">
                  Loading table data...
                </Text>
              </Flex>
            )}
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}
