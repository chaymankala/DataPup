declare global {
  interface Window {
    openTableTab?: (database: string, tableName: string) => void
  }
}

export {}