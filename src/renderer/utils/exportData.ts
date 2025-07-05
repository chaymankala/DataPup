export function exportToCSV(data: any[], filename: string = 'export.csv') {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get headers from the first row
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    // Headers
    headers.map((header) => escapeCSVValue(header)).join(','),
    // Data rows
    ...data.map((row) => headers.map((header) => escapeCSVValue(row[header])).join(','))
  ].join('\n')

  // Create blob and download
  downloadFile(csvContent, filename, 'text/csv')
}

export function exportToJSON(data: any[], filename: string = 'export.json') {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const jsonContent = JSON.stringify(data, null, 2)
  downloadFile(jsonContent, filename, 'application/json')
}

export function exportToSQL(
  data: any[],
  tableName: string = 'exported_data',
  filename: string = 'export.sql'
) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const headers = Object.keys(data[0])

  // Create INSERT statements
  const sqlStatements = data.map((row) => {
    const values = headers.map((header) => {
      const value = row[header]
      if (value === null || value === undefined) return 'NULL'
      if (typeof value === 'number') return value
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
      return `'${escapeSQL(String(value))}'`
    })

    return `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values.join(', ')});`
  })

  const sqlContent = sqlStatements.join('\n')
  downloadFile(sqlContent, filename, 'text/plain')
}

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)

  // If the value contains comma, newline, or quotes, wrap it in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    // Escape quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''")
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
