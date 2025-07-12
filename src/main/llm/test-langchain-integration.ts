import { GeminiLLM } from './gemini'
import { ApiBasedEmbedding } from './LlamaIndexEmbedding'

// Test function to verify LangChain integration
export async function testLangChainIntegration(apiKey: string) {
  try {
    console.log('Testing LangChain integration...')

    // Create LLM instance
    const llm = new GeminiLLM(apiKey)

    // Create embedding instance
    const embedding = new ApiBasedEmbedding(llm)

    // Test embedding
    const testText = 'This is a test query for database schema'
    console.log('Testing embedding generation...')
    const embeddingResult = await embedding.embedQuery(testText)

    console.log(`Embedding generated successfully! Vector length: ${embeddingResult.length}`)
    console.log(`First 5 values: ${embeddingResult.slice(0, 5)}`)

    // Test multiple embeddings
    const texts = ['Query 1', 'Query 2', 'Query 3']
    console.log('Testing multiple embeddings...')
    const multipleEmbeddings = await embedding.embedDocuments(texts)

    console.log(`Multiple embeddings generated successfully! Count: ${multipleEmbeddings.length}`)

    return {
      success: true,
      singleEmbeddingLength: embeddingResult.length,
      multipleEmbeddingsCount: multipleEmbeddings.length
    }
  } catch (error) {
    console.error('LangChain integration test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
