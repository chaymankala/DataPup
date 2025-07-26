import React from 'react'
import { Flex, Select, Text, Button } from '@radix-ui/themes'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalRows: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  isLoading?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalRows,
  pageSize,
  pageSizeOptions = [25, 50, 100, 500],
  onPageChange,
  onPageSizeChange,
  isLoading = false
}: PaginationProps) {
  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRow = Math.min(currentPage * pageSize, totalRows)

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (isLoading) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault()
        onPageChange(currentPage - 1)
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight' && currentPage < totalPages) {
        e.preventDefault()
        onPageChange(currentPage + 1)
      }
    },
    [currentPage, totalPages, onPageChange, isLoading]
  )

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <Flex align="center" gap="3" p="2" style={{ borderTop: '1px solid var(--gray-4)' }}>
      <Flex align="center" gap="2">
        <Text size="1" color="gray">
          Rows per page:
        </Text>
        <Select.Root
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={isLoading}
        >
          <Select.Trigger size="1" />
          <Select.Content>
            {pageSizeOptions.map((size) => (
              <Select.Item key={size} value={size.toString()}>
                {size}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>

      <Text size="1" color="gray">
        {totalRows === 0
          ? 'No rows'
          : `${startRow.toLocaleString()}-${endRow.toLocaleString()} of ${totalRows.toLocaleString()} rows`}
      </Text>

      <Flex gap="1">
        <Button
          size="1"
          variant="ghost"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          title="First page (Ctrl+Home)"
        >
          <DoubleArrowLeftIcon />
        </Button>
        <Button
          size="1"
          variant="ghost"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          title="Previous page (Ctrl+←)"
        >
          <ChevronLeftIcon />
        </Button>

        <Flex align="center" gap="2" px="2">
          <Text size="1">
            Page {currentPage} of {totalPages}
          </Text>
        </Flex>

        <Button
          size="1"
          variant="ghost"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          title="Next page (Ctrl+→)"
        >
          <ChevronRightIcon />
        </Button>
        <Button
          size="1"
          variant="ghost"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          title="Last page (Ctrl+End)"
        >
          <DoubleArrowRightIcon />
        </Button>
      </Flex>
    </Flex>
  )
}
