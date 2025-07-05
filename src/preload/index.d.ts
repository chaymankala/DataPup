import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      database: {
        connect: (config: any) => Promise<{ success: boolean; message: string }>
        disconnect: () => Promise<{ success: boolean }>
        query: (sql: string) => Promise<{ success: boolean; data?: any[]; message: string }>
      }
    }
  }
}
