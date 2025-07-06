import { useState } from 'react'
import { Button, Flex, Text, Card, Box, TextArea, Badge } from '@radix-ui/themes'
import { Skeleton } from '../ui'
import './NaturalLanguageQueryInput.css'

interface NaturalLanguageQueryInputProps {
  connectionId: string
  connectionName: string
  onQueryGenerated: (sql: string, explanation?: string) => void
  onQueryExecuted: (result: any) => void
}

interface QueryGenerationResult {
  success: boolean
  sqlQuery?: string
  explanation?: string
  error?: string
}

interface QueryExecutionResult {
  success: boolean
  data?: any[]
  message: string
  error?: string
}

export function NaturalLanguageQueryInput({
  connectionId,
  connectionName,
  onQueryGenerated,
  onQueryExecuted
}: NaturalLanguageQueryInputProps) {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [generatedSQL, setGeneratedSQL] = useState('')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  const [showSchema, setShowSchema] = useState(false)
  const [schemaInfo, setSchemaInfo] = useState('')

  const handleGenerateSQL = async () => {
    if (!naturalLanguageQuery.trim()) return

    try {
      setIsGenerating(true)
      setError('')
      setGeneratedSQL('')
      setExplanation('')

      const result: QueryGenerationResult = await window.api.naturalLanguageQuery.generateSQL({
        connectionId,
        naturalLanguageQuery: naturalLanguageQuery.trim(),
        includeSampleData: true,
        maxSampleRows: 3
      })

      if (result.success && result.sqlQuery) {
        setGeneratedSQL(result.sqlQuery)
        setExplanation(result.explanation || '')
        onQueryGenerated(result.sqlQuery, result.explanation)
      } else {
        setError(result.error || 'Failed to generate SQL query')
      }
    } catch (error) {
      console.error('Error generating SQL:', error)
      setError('Failed to generate SQL query')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExecuteQuery = async () => {
    if (!generatedSQL.trim()) return

    try {
      setIsExecuting(true)
      setError('')

      const result: QueryExecutionResult = await window.api.database.query(connectionId, generatedSQL.trim())

      if (result.success) {
        onQueryExecuted(result)
      } else {
        setError(result.error || result.message)
      }
    } catch (error) {
      console.error('Error executing query:', error)
      setError('Failed to execute query')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleProcessAndExecute = async () => {
    if (!naturalLanguageQuery.trim()) return

    try {
      setIsGenerating(true)
      setIsExecuting(true)
      setError('')
      setGeneratedSQL('')
      setExplanation('')

      const result = await window.api.naturalLanguageQuery.process({
        connectionId,
        naturalLanguageQuery: naturalLanguageQuery.trim(),
        includeSampleData: true,
        maxSampleRows: 3
      })

      if (result.success && result.sqlQuery) {
        setGeneratedSQL(result.sqlQuery)
        setExplanation(result.explanation || '')
        onQueryGenerated(result.sqlQuery, result.explanation)

        if (result.queryResult) {
          onQueryExecuted(result.queryResult)
        }
      } else {
        setError(result.error || 'Failed to process natural language query')
      }
    } catch (error) {
      console.error('Error processing query:', error)
      setError('Failed to process natural language query')
    } finally {
      setIsGenerating(false)
      setIsExecuting(false)
    }
  }

  const handleShowSchema = async () => {
    if (showSchema) {
      setShowSchema(false)
      setSchemaInfo('')
      return
    }

    try {
      const result = await window.api.naturalLanguageQuery.getSchema(connectionId)
      if (result.success && result.formattedSchema) {
        setSchemaInfo(result.formattedSchema)
        setShowSchema(true)
      }
    } catch (error) {
      console.error('Error getting schema:', error)
    }
  }

  const exampleQueries = [
    'Show me all users',
    'Count the number of records in the users table',
    'Find users created in the last 7 days',
    'Show me the top 10 users by creation date',
    'What tables are available in this database?'
  ]

  return (
    <div className="natural-language-query-input">
      <Flex direction="column" gap="4" height="100%">
        {/* Header */}
        <Flex justify="between" align="center" px="4" pt="4">
          <Flex align="center" gap="3">
            <Text size="3" weight="bold">
              Natural Language Query
            </Text>
            <Text size="2" color="gray">
              {connectionName}
            </Text>
          </Flex>
          <Flex gap="2" align="center">
            <Button size="1" variant="soft" onClick={handleShowSchema}>
              {showSchema ? 'Hide Schema' : 'Show Schema'}
            </Button>
          </Flex>
        </Flex>

        {/* Schema Information */}
        {showSchema && schemaInfo && (
          <Card className="schema-card">
            <Text size="2" weight="bold" mb="2">
              Database Schema
            </Text>
            <Box className="schema-content">
              <pre>{schemaInfo}</pre>
            </Box>
          </Card>
        )}

        {/* Natural Language Input */}
        <Card className="query-input-card">
          <Text size="2" weight="bold" mb="3">
            Ask a question about your data
          </Text>

          <TextArea
            placeholder="e.g., Show me all users, Count records in the users table, Find recent data..."
            value={naturalLanguageQuery}
            onChange={(e) => setNaturalLanguageQuery(e.target.value)}
            className="natural-language-textarea"
            rows={3}
          />

          {/* Example Queries */}
          <Box mt="3">
            <Text size="1" color="gray" mb="2">
              Example queries:
            </Text>
            <Flex gap="1" wrap="wrap">
              {exampleQueries.map((example, index) => (
                <Badge
                  key={index}
                  variant="soft"
                  className="example-query-badge"
                  onClick={() => setNaturalLanguageQuery(example)}
                >
                  {example}
                </Badge>
              ))}
            </Flex>
          </Box>

          {/* Action Buttons */}
          <Flex gap="2" mt="4">
            <Button
              onClick={handleGenerateSQL}
              disabled={isGenerating || !naturalLanguageQuery.trim()}
              size="2"
              variant="soft"
            >
              {isGenerating ? 'Generating...' : 'Generate SQL'}
            </Button>
            <Button
              onClick={handleProcessAndExecute}
              disabled={isGenerating || isExecuting || !naturalLanguageQuery.trim()}
              size="2"
            >
              {isGenerating || isExecuting ? 'Processing...' : 'Ask & Execute'}
            </Button>
          </Flex>
        </Card>

        {/* Generated SQL */}
        {generatedSQL && (
          <Card className="generated-sql-card">
            <Flex justify="between" align="center" mb="3">
              <Text size="2" weight="bold">
                Generated SQL
              </Text>
              {explanation && (
                <Text size="1" color="gray">
                  {explanation}
                </Text>
              )}
            </Flex>

            <Box className="sql-display">
              <pre>{generatedSQL}</pre>
            </Box>

            <Flex gap="2" mt="3">
              <Button
                onClick={handleExecuteQuery}
                disabled={isExecuting}
                size="2"
                variant="soft"
              >
                {isExecuting ? 'Executing...' : 'Execute SQL'}
              </Button>
            </Flex>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="error-card">
            <Text color="red" weight="bold" size="2">
              Error
            </Text>
            <Text color="red" size="1" mt="1">
              {error}
            </Text>
          </Card>
        )}
      </Flex>
    </div>
  )
}
