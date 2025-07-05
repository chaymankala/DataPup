import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { SecureStorage, DatabaseConnection } from './secureStorage'
import { DatabaseManager } from './database/manager'
import { DatabaseConfig } from './database/interface'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Initialize secure storage and database manager
const secureStorage = new SecureStorage()
const databaseManager = new DatabaseManager()

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.datapup')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for database operations
ipcMain.handle('db:connect', async (_, connectionConfig) => {
  try {
    // Generate a unique ID for the connection
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create connection object
    const connection: DatabaseConnection = {
      id: connectionId,
      name: `${connectionConfig.type} - ${connectionConfig.host}:${connectionConfig.port}`,
      type: connectionConfig.type,
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
      username: connectionConfig.username,
      password: connectionConfig.password,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }

    // Save connection securely if requested
    if (connectionConfig.saveConnection !== false) {
      secureStorage.saveConnection(connection)
    }
    
    // Connect to the actual database
    const dbResult = await databaseManager.connect(connectionConfig as DatabaseConfig, connectionId)
    
    if (dbResult.success) {
      return { 
        success: true, 
        message: dbResult.message,
        connectionId: connectionId
      }
    } else {
      return { 
        success: false, 
        message: dbResult.message,
        error: dbResult.error
      }
    }
  } catch (error) {
    console.error('Connection error:', error)
    return { 
      success: false, 
      message: 'Connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('db:disconnect', async (_, connectionId?: string) => {
  try {
    if (connectionId) {
      const result = await databaseManager.disconnect(connectionId)
      return result
    } else {
      // Disconnect all active connections
      await databaseManager.cleanup()
      return { success: true, message: 'All connections closed' }
    }
  } catch (error) {
    console.error('Disconnection error:', error)
    return { 
      success: false, 
      message: 'Failed to disconnect',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('db:query', async (_, connectionId: string, query: string) => {
  try {
    console.log('Main process: Executing query for connection', connectionId)
    const result = await databaseManager.query(connectionId, query)
    console.log('Main process: Query result', result)
    return result
  } catch (error) {
    console.error('Query execution error:', error)
    return { 
      success: false, 
      message: 'Query execution failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

// IPC handlers for connection management
ipcMain.handle('connections:getAll', async () => {
  try {
    const connections = secureStorage.getConnections()
    return { success: true, connections }
  } catch (error) {
    console.error('Error getting connections:', error)
    return { success: false, connections: [] }
  }
})

ipcMain.handle('connections:getById', async (_, id: string) => {
  try {
    const connection = secureStorage.getConnection(id)
    return { success: true, connection }
  } catch (error) {
    console.error('Error getting connection:', error)
    return { success: false, connection: null }
  }
})

ipcMain.handle('connections:delete', async (_, id: string) => {
  try {
    const deleted = secureStorage.deleteConnection(id)
    return { success: deleted }
  } catch (error) {
    console.error('Error deleting connection:', error)
    return { success: false }
  }
})

ipcMain.handle('connections:updateLastUsed', async (_, id: string) => {
  try {
    secureStorage.updateLastUsed(id)
    return { success: true }
  } catch (error) {
    console.error('Error updating last used:', error)
    return { success: false }
  }
})

// Additional database operation handlers
ipcMain.handle('db:getDatabases', async (_, connectionId: string) => {
  try {
    const result = await databaseManager.getDatabases(connectionId)
    return result
  } catch (error) {
    console.error('Error getting databases:', error)
    return { 
      success: false, 
      message: 'Failed to get databases',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('db:getTables', async (_, connectionId: string, database?: string) => {
  try {
    const result = await databaseManager.getTables(connectionId, database)
    return result
  } catch (error) {
    console.error('Error getting tables:', error)
    return { 
      success: false, 
      message: 'Failed to get tables',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('db:getTableSchema', async (_, connectionId: string, tableName: string, database?: string) => {
  try {
    const result = await databaseManager.getTableSchema(connectionId, tableName, database)
    return result
  } catch (error) {
    console.error('Error getting table schema:', error)
    return { 
      success: false, 
      message: 'Failed to get table schema',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('db:isConnected', async (_, connectionId: string) => {
  try {
    const isConnected = databaseManager.isConnected(connectionId)
    return { success: true, isConnected }
  } catch (error) {
    console.error('Error checking connection status:', error)
    return { success: false, isConnected: false }
  }
})

ipcMain.handle('db:getSupportedTypes', async () => {
  try {
    const supportedTypes = databaseManager.getSupportedDatabaseTypes()
    return { success: true, types: supportedTypes }
  } catch (error) {
    console.error('Error getting supported database types:', error)
    return { success: false, types: [] }
  }
})