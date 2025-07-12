# LangChain Integration

This document describes the LangChain integration implemented in DataPup, which provides API-based embedding capabilities without requiring native dependencies.

## Overview

The LangChain integration in DataPup uses API-based embedding models instead of local models to avoid cross-platform compatibility issues with native dependencies like `@xenova/transformers` and `sharp`.

## Architecture

### API-Based Embedding

Instead of using local embedding models, DataPup uses the same API providers (Gemini, OpenAI, Claude) for both text generation and embeddings. This provides:

- **Cross-platform compatibility**: No native dependencies required
- **Consistent API keys**: Same provider for both LLM and embedding
- **Reliable performance**: No local model loading or memory issues

### Implementation

#### 1. LLM Interface Extension

The `LLMInterface` has been extended to include embedding capabilities:

```typescript
export interface LLMInterface {
  generateSQL(request: SQLGenerationRequest): Promise<SQLGenerationResponse>
  validateQuery(request: ValidationRequest): Promise<ValidationResponse>
  generateExplanation(sql: string, databaseType: string): Promise<string>
  embedQuery(text: string): Promise<number[]> // New method
  cleanup?(): Promise<void>
}
```

#### 2. Provider Implementations

Each LLM provider implements the `embedQuery` method:

- **Gemini**: Uses `text-embedding-004` model
- **OpenAI**: Uses `text-embedding-3-small` model
- **Claude**: Uses `text-embedding-v3` model

#### 3. LangChain Bridge

The `ApiBasedEmbedding` class acts as a bridge between DataPup's LLM interface and LangChain's embedding interface:

```typescript
export class ApiBasedEmbedding {
  private llm: LLMInterface

  constructor(llm: LLMInterface) {
    this.llm = llm
  }

  async embedQuery(text: string): Promise<number[]> {
    return await this.llm.embedQuery(text)
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(texts.map((text) => this.llm.embedQuery(text)))
    return embeddings
  }
}
```

## Usage

### In Natural Language Query Processor

The embedding model is automatically set up when processing natural language queries:

```typescript
// Get LLM instance
const llmInstance = this.llmManager.getLlmInstance(llmConnectionId)

// Create API-based embedding instance
const embeddingModel = new ApiBasedEmbedding(llmInstance)

// Use with LangChain components
// const vectorStore = new VectorStoreIndex(embeddingModel)
```

### Testing

Use the test function to verify the integration:

```typescript
import { testLangChainIntegration } from './test-langchain-integration'

const result = await testLangChainIntegration(apiKey)
if (result.success) {
  console.log('LangChain integration working!')
}
```

## Benefits

1. **No Native Dependencies**: Eliminates issues with `@xenova/transformers` and `sharp`
2. **Cross-Platform**: Works on all platforms without compilation issues
3. **Consistent Architecture**: Uses same API providers for all AI operations
4. **Reliable**: No local model loading or memory management issues
5. **Scalable**: Can easily switch between different embedding models

## Configuration

The embedding model is automatically configured based on the selected LLM provider:

- **Gemini**: `text-embedding-004`
- **OpenAI**: `text-embedding-3-small`
- **Claude**: `text-embedding-v3`

## Future Enhancements

1. **Vector Storage**: Integrate with vector databases for query history
2. **Semantic Search**: Add semantic search capabilities for database schemas
3. **Query Similarity**: Find similar queries in history
4. **Context Enhancement**: Use embeddings to improve conversation context

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure the API key has embedding permissions
2. **Rate Limits**: Monitor API usage to avoid rate limiting
3. **Network Issues**: Embedding requires internet connection

### Debugging

Enable debug logging to troubleshoot embedding issues:

```typescript
console.log('Setting up embedding model...')
const embeddingModel = new ApiBasedEmbedding(llmInstance)
console.log('Embedding model ready')
```
