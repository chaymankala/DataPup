import type { SQLContext, Position } from '../types'

export class SQLContextParser {
  private readonly keywordPatterns = {
    select: /\bSELECT\b/i,
    from: /\bFROM\b/i,
    where: /\bWHERE\b/i,
    join: /\b(JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|INNER\s+JOIN|OUTER\s+JOIN)\b/i,
    on: /\bON\b/i,
    groupBy: /\bGROUP\s+BY\b/i,
    orderBy: /\bORDER\s+BY\b/i,
    having: /\bHAVING\b/i
  }

  parseContext(model: any, position: Position): SQLContext {
    const textBeforeCursor = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    })

    const currentLine = model.getLineContent(position.lineNumber)
    const currentWord = this.getCurrentWord(currentLine, position.column)

    const context: SQLContext = {
      type: 'unknown',
      tableAliases: new Map(),
      availableTables: [],
      availableColumns: new Map(),
      cursorPosition: position,
      precedingText: textBeforeCursor,
      currentWord
    }

    this.parseTableAliases(textBeforeCursor, context)
    this.determineContextType(textBeforeCursor, currentLine, position, context)

    return context
  }

  private getCurrentWord(line: string, column: number): string {
    const beforeCursor = line.substring(0, column - 1)
    const afterCursor = line.substring(column - 1)

    const beforeMatch = beforeCursor.match(/[\w.]+$/)
    const afterMatch = afterCursor.match(/^[\w.]*/)

    const before = beforeMatch ? beforeMatch[0] : ''
    const after = afterMatch ? afterMatch[0] : ''

    return before + after
  }

  private parseTableAliases(text: string, context: SQLContext) {
    const fromPattern = /FROM\s+([^\s,]+)(?:\s+(?:AS\s+)?(\w+))?/gi
    const joinPattern = /JOIN\s+([^\s,]+)(?:\s+(?:AS\s+)?(\w+))?/gi

    let match

    while ((match = fromPattern.exec(text)) !== null) {
      const tableName = match[1]
      const alias = match[2] || tableName
      context.tableAliases.set(alias, tableName)
      context.availableTables.push(tableName)
    }

    while ((match = joinPattern.exec(text)) !== null) {
      const tableName = match[1]
      const alias = match[2] || tableName
      context.tableAliases.set(alias, tableName)
      context.availableTables.push(tableName)
    }
  }

  private determineContextType(
    textBefore: string,
    currentLine: string,
    position: Position,
    context: SQLContext
  ) {
    const lowerText = textBefore.toLowerCase()
    const lastKeywordMatch = this.findLastKeyword(lowerText)

    if (!lastKeywordMatch) {
      context.type = 'keyword'
      return
    }

    const afterKeyword = textBefore.substring(
      lastKeywordMatch.index + lastKeywordMatch.keyword.length
    )
    const hasContent = afterKeyword.trim().length > 0

    switch (lastKeywordMatch.type) {
      case 'select':
        if (hasContent) {
          // Check if we're at the end of the SELECT clause and should suggest keywords
          const endsWithSpace = textBefore.endsWith(' ')
          const hasFrom = this.hasFromClause(lowerText)
          const shouldSuggestKeywords = endsWithSpace && !hasFrom

          context.type = shouldSuggestKeywords ? 'select_complete' : 'column'
        } else {
          context.type = 'select'
        }
        context.currentClause = 'SELECT'
        break

      case 'from':
        context.type = 'from'
        context.currentClause = 'FROM'
        break

      case 'where':
      case 'having':
        context.type = 'where'
        context.currentClause = lastKeywordMatch.type.toUpperCase()
        break

      case 'join': {
        const onIndex = afterKeyword.toLowerCase().lastIndexOf(' on ')
        if (onIndex === -1) {
          context.type = 'from'
          context.currentClause = 'JOIN'
        } else {
          context.type = 'where'
          context.currentClause = 'ON'
        }
        break
      }

      case 'groupBy':
      case 'orderBy':
        context.type = 'column'
        context.currentClause = lastKeywordMatch.type === 'groupBy' ? 'GROUP BY' : 'ORDER BY'
        break

      default:
        context.type = 'unknown'
    }

    if (context.currentWord.includes('(')) {
      context.type = 'function'
    }
  }

  private hasFromClause(text: string): boolean {
    return this.keywordPatterns.from.test(text)
  }

  private findLastKeyword(text: string): { type: string; keyword: string; index: number } | null {
    let lastMatch: { type: string; keyword: string; index: number } | null = null
    let lastIndex = -1

    Object.entries(this.keywordPatterns).forEach(([type, pattern]) => {
      const matches = Array.from(text.matchAll(new RegExp(pattern, 'gi')))
      if (matches.length > 0) {
        const match = matches[matches.length - 1]
        if (match.index! > lastIndex) {
          lastIndex = match.index!
          lastMatch = {
            type,
            keyword: match[0],
            index: match.index!
          }
        }
      }
    })

    return lastMatch
  }
}
