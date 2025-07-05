import { useState, useEffect } from 'react'
import { Box, Button, Flex, Text, Select, TextField, Table, Badge } from '@radix-ui/themes'
import { Skeleton } from '../ui'
import { TableFilter } from '../../types/tabs'
import { exportToCSV, exportToJSON } from '../../utils/exportData'
import './TableView.css'

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

  // Load table schema on mount
  useEffect(() => {
    loadTableSchema()
  }, [connectionId, database, tableName])

  // Execute query when component mounts or filters change
  useEffect(() => {
    executeQuery()
  }, [connectionId, database, tableName])

  const loadTableSchema = async () => {
    try {
      setIsLoadingSchema(true)
      const schemaResult = await window.api.database.getTableSchema(connectionId, tableName, database)
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
    
    const validFilters = filters.filter(f => 
      f.column && f.operator && (f.value || f.operator === 'IS NULL' || f.operator === 'IS NOT NULL')
    )
    
    if (validFilters.length > 0) {
      const whereClauses = validFilters.map(filter => {
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
      
      const queryResult = await window.api.database.query(connectionId, query)
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
    const newFilters = filters.map(f => 
      f.id === id ? { ...f, ...updates } : f
    )
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const removeFilter = (id: string) => {
    const newFilters = filters.filter(f => f.id !== id)
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const formatResult = (data: any[]) => {
    if (!data || data.length === 0) {
      return <Text color="gray">No data returned</Text>
    }

    const columns = Object.keys(data[0])

    return (
      <Table.Root size="1">
        <Table.Header>
          <Table.Row>
            {columns.map((column) => (
              <Table.ColumnHeaderCell key={column}>
                <Text size="1" weight="medium">
                  {column}
                </Text>
              </Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((row, index) => (
            <Table.Row key={index}>
              {columns.map((column) => (
                <Table.Cell key={column}>
                  <Text size="1">
                    {row[column] !== null && row[column] !== undefined ? (
                      String(row[column])
                    ) : (
                      <Text size="1" color="gray">null</Text>
                    )}
                  </Text>
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    )
  }

  return (
    <Box className="table-view">
      <Flex direction="column" height="100%">
        {/* Filters Section */}
        <Box className="filters-section" p="2">
          <Flex direction="column" gap="2">
            {filters.map((filter) => (
              <Flex key={filter.id} gap="2" align="center">
                <Select.Root
                  value={filter.column}
                  onValueChange={(value) => updateFilter(filter.id, { column: value })}
                  disabled={isLoadingSchema}
                >
                  <Select.Trigger placeholder="Select column" className="filter-select" />
                  <Select.Content>
                    {columns.map((col) => (
                      <Select.Item key={col.name} value={col.name}>
                        {col.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                <Select.Root
                  value={filter.operator}
                  onValueChange={(value) => updateFilter(filter.id, { operator: value as any })}
                >
                  <Select.Trigger className="filter-select" />
                  <Select.Content>
                    {OPERATORS.map((op) => (
                      <Select.Item key={op.value} value={op.value}>
                        {op.label}
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
                  />
                )}

                <Button
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => removeFilter(filter.id)}
                >
                  ×
                </Button>
              </Flex>
            ))}

            <Flex gap="2">
              <Button size="1" variant="outline" onClick={addFilter} disabled={isLoadingSchema}>
                + Add Filter
              </Button>
              <Button size="1" onClick={executeQuery} disabled={isLoading}>
                Apply Filters
              </Button>
            </Flex>
          </Flex>
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
                </>
              )}
            </Flex>
            
            {result?.success && result.data && result.data.length > 0 && (
              <Flex gap="1">
                <Button
                  size="1"
                  variant="ghost"
                  onClick={() => exportToCSV(result.data || [], `${tableName}-export.csv`)}
                >
                  CSV
                </Button>
                <Button
                  size="1"
                  variant="ghost"
                  onClick={() => exportToJSON(result.data || [], `${tableName}-export.json`)}
                >
                  JSON
                </Button>
              </Flex>
            )}
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
                  {formatResult(result.data || [])}
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