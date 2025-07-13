import { LLMInterface } from './interface'

export class ApiBasedEmbedding {
  private llm: LLMInterface

  constructor(llm: LLMInterface) {
    this.llm = llm
  }

  // This method is required by LangChain's embedding interface
  async embedQuery(text: string): Promise<number[]> {
    return await this.llm.embedQuery(text)
  }

  // Method to embed multiple texts
  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(texts.map((text) => this.llm.embedQuery(text)))
    return embeddings
  }
}
