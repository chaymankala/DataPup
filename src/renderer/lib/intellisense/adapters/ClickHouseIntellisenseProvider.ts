import { IntellisenseProvider } from '../IntellisenseProvider'
import type { CompletionItem, SQLContext, DatabaseSchema } from '../types'

export class ClickHouseIntellisenseProvider extends IntellisenseProvider {
  getDatabaseSpecificKeywords(): string[] {
    return [
      'ARRAY JOIN',
      'SAMPLE',
      'PREWHERE',
      'FINAL',
      'SETTINGS',
      'FORMAT',
      'WITH TOTALS',
      'ASOF',
      'GLOBAL',
      'ANY',
      'ALL',
      'USING',
      'PARTITION BY',
      'PRIMARY KEY',
      'ENGINE',
      'TTL',
      'CODEC',
      'MATERIALIZED',
      'ALIAS',
      'COMMENT',
      'CLUSTER',
      'ON CLUSTER',
      'DISTRIBUTED',
      'REPLICATED',
      'SHARDED'
    ]
  }

  getDatabaseSpecificFunctions(): string[] {
    return [
      'toDate',
      'toDateTime',
      'toDateTime64',
      'toInt8',
      'toInt16',
      'toInt32',
      'toInt64',
      'toUInt8',
      'toUInt16',
      'toUInt32',
      'toUInt64',
      'toFloat32',
      'toFloat64',
      'toString',
      'toFixedString',
      'toDecimal32',
      'toDecimal64',
      'toDecimal128',
      'toUUID',
      'now',
      'today',
      'yesterday',
      'timeSlot',
      'toStartOfMonth',
      'toStartOfQuarter',
      'toStartOfYear',
      'toStartOfHour',
      'toStartOfMinute',
      'toStartOfFiveMinute',
      'toStartOfTenMinutes',
      'toStartOfFifteenMinutes',
      'toStartOfInterval',
      'addYears',
      'addMonths',
      'addWeeks',
      'addDays',
      'addHours',
      'addMinutes',
      'addSeconds',
      'subtractYears',
      'subtractMonths',
      'subtractWeeks',
      'subtractDays',
      'subtractHours',
      'subtractMinutes',
      'subtractSeconds',
      'dateDiff',
      'formatDateTime',
      'arrayJoin',
      'arrayMap',
      'arrayFilter',
      'arrayReduce',
      'arrayFirst',
      'arrayFirstIndex',
      'has',
      'hasAll',
      'hasAny',
      'indexOf',
      'countEqual',
      'arrayEnumerate',
      'arrayEnumerateUniq',
      'arrayDistinct',
      'arrayIntersect',
      'arrayResize',
      'arraySlice',
      'arraySort',
      'arrayReverseSort',
      'arrayConcat',
      'arrayElement',
      'splitByChar',
      'splitByString',
      'splitByRegexp',
      'joinGet',
      'dictGet',
      'dictGetOrDefault',
      'dictHas',
      'dictGetHierarchy',
      'dictIsIn',
      'regionToName',
      'regionToCity',
      'regionToCountry',
      'regionToContinent',
      'regionToPopulation',
      'JSONExtractString',
      'JSONExtractInt',
      'JSONExtractFloat',
      'JSONExtractBool',
      'JSONExtractRaw',
      'JSONExtractArrayRaw',
      'visitParamExtractString',
      'visitParamExtractInt',
      'visitParamExtractFloat',
      'visitParamExtractBool',
      'URLPathHierarchy',
      'URLHierarchy',
      'extractURLParameterNames',
      'extractURLParameters',
      'extractURLParameter',
      'cutToFirstSignificantSubdomain',
      'cutWWW',
      'cutQueryString',
      'cutFragment',
      'cutQueryStringAndFragment',
      'cutURLParameter'
    ]
  }

  formatIdentifier(identifier: string): string {
    return `\`${identifier}\``
  }

  getColumnSuggestions(context: SQLContext, schema: DatabaseSchema): CompletionItem[] {
    const suggestions: CompletionItem[] = []
    const processedColumns = new Set<string>()

    if (context.availableTables.length > 0) {
      context.availableTables.forEach((tableName) => {
        const tableInfo = schema.tables.get(tableName)
        if (tableInfo) {
          tableInfo.columns.forEach((column) => {
            const qualifiedName = `${tableName}.${column.name}`

            if (!processedColumns.has(column.name)) {
              suggestions.push({
                label: column.name,
                kind: this.monaco.languages.CompletionItemKind.Field,
                insertText: this.formatIdentifier(column.name),
                detail: `${column.type}${column.nullable ? ' (nullable)' : ' NOT NULL'}`,
                documentation: `Column from ${tableName}`,
                sortText: '4' + column.name
              })
              processedColumns.add(column.name)
            }

            suggestions.push({
              label: qualifiedName,
              kind: this.monaco.languages.CompletionItemKind.Field,
              insertText: `${this.formatIdentifier(tableName)}.${this.formatIdentifier(column.name)}`,
              detail: column.type,
              documentation: `Fully qualified column name`,
              sortText: '5' + qualifiedName
            })
          })
        }
      })

      context.tableAliases.forEach((tableName, alias) => {
        if (alias !== tableName) {
          const tableInfo = schema.tables.get(tableName)
          if (tableInfo) {
            tableInfo.columns.forEach((column) => {
              const aliasedName = `${alias}.${column.name}`
              suggestions.push({
                label: aliasedName,
                kind: this.monaco.languages.CompletionItemKind.Field,
                insertText: `${this.formatIdentifier(alias)}.${this.formatIdentifier(column.name)}`,
                detail: column.type,
                documentation: `Column from ${tableName} (aliased as ${alias})`,
                sortText: '6' + aliasedName
              })
            })
          }
        }
      })
    }

    const clickHouseAggregates = [
      { name: 'count()', detail: 'Count of rows' },
      { name: 'countIf(condition)', detail: 'Conditional count' },
      { name: 'sum(column)', detail: 'Sum of values' },
      { name: 'sumIf(column, condition)', detail: 'Conditional sum' },
      { name: 'avg(column)', detail: 'Average value' },
      { name: 'avgIf(column, condition)', detail: 'Conditional average' },
      { name: 'min(column)', detail: 'Minimum value' },
      { name: 'max(column)', detail: 'Maximum value' },
      { name: 'argMin(arg, val)', detail: 'Argument of minimum' },
      { name: 'argMax(arg, val)', detail: 'Argument of maximum' },
      { name: 'groupArray(column)', detail: 'Array of values' },
      { name: 'groupUniqArray(column)', detail: 'Array of unique values' },
      { name: 'uniq(column)', detail: 'Count of unique values' },
      { name: 'uniqExact(column)', detail: 'Exact count of unique values' },
      { name: 'any(column)', detail: 'Any value from group' },
      { name: 'anyLast(column)', detail: 'Last value from group' },
      { name: 'quantile(level)(column)', detail: 'Quantile at given level' },
      { name: 'median(column)', detail: 'Median value' }
    ]

    clickHouseAggregates.forEach((agg) => {
      suggestions.push({
        label: agg.name,
        kind: this.monaco.languages.CompletionItemKind.Function,
        insertText: agg.name,
        detail: 'ClickHouse Aggregate Function',
        documentation: agg.detail,
        sortText: '7' + agg.name
      })
    })

    return suggestions
  }
}
