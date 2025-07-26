/**
 * Utility functions for parsing and modifying SQL queries
 */

/**
 * Check if a query is a SELECT statement
 */
export function isSelectQuery(query: string): boolean {
  const trimmed = query.trim().toUpperCase()
  return trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')
}

/**
 * Check if a query has a LIMIT clause
 */
export function hasLimitClause(query: string): boolean {
  // Simple regex to check for LIMIT clause
  // This is a basic implementation and may not cover all edge cases
  const limitRegex = /\bLIMIT\s+\d+/i
  return limitRegex.test(query)
}

/**
 * Add a LIMIT clause to a SELECT query if it doesn't have one
 */
export function addLimitToQuery(query: string, limit: number): string {
  if (!isSelectQuery(query) || hasLimitClause(query)) {
    return query
  }

  // Remove trailing semicolon if present
  let modifiedQuery = query.trim()
  if (modifiedQuery.endsWith(';')) {
    modifiedQuery = modifiedQuery.slice(0, -1).trim()
  }

  // Add LIMIT clause
  return `${modifiedQuery} LIMIT ${limit}`
}

/**
 * Get the limit value from a query if it has one
 */
export function getLimitFromQuery(query: string): number | null {
  const limitMatch = query.match(/\bLIMIT\s+(\d+)/i)
  if (limitMatch && limitMatch[1]) {
    return parseInt(limitMatch[1], 10)
  }
  return null
}

/**
 * Estimate if a query might return a large result set
 * This is a simple heuristic based on common patterns
 */
export function mightReturnLargeResultSet(query: string): boolean {
  const upperQuery = query.toUpperCase()

  // Check for obvious large result patterns
  if (upperQuery.includes('SELECT *') && !hasLimitClause(query)) {
    return true
  }

  // Check for aggregate functions which typically return small results
  const aggregatePattern = /\b(COUNT|SUM|AVG|MIN|MAX|GROUP BY)\b/i
  if (aggregatePattern.test(query)) {
    return false
  }

  // If no LIMIT and appears to be selecting data, assume it might be large
  return isSelectQuery(query) && !hasLimitClause(query)
}
