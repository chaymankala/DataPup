import { useState, useEffect } from 'react'

export interface QueryHistoryItem {
  id: string
  query: string
  timestamp: Date
  duration?: number
  rowCount?: number
  success: boolean
  error?: string
  connectionName: string
}

const STORAGE_KEY = 'data-pup-query-history'
const MAX_HISTORY_ITEMS = 100

export function useQueryHistory(connectionName: string) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY)
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setHistory(historyWithDates)
      } catch (error) {
        console.error('Error loading query history:', error)
      }
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  }, [history])

  const addToHistory = (
    query: string,
    success: boolean,
    duration?: number,
    rowCount?: number,
    error?: string
  ) => {
    const newItem: QueryHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      query: query.trim(),
      timestamp: new Date(),
      duration,
      rowCount,
      success,
      error,
      connectionName
    }

    setHistory((prev) => {
      // Add new item at the beginning and limit total items
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS)
      return updated
    })
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const getFilteredHistory = (searchTerm: string = '') => {
    if (!searchTerm) {
      return history.filter((item) => item.connectionName === connectionName)
    }

    const term = searchTerm.toLowerCase()
    return history.filter(
      (item) => item.connectionName === connectionName && item.query.toLowerCase().includes(term)
    )
  }

  return {
    history: getFilteredHistory(),
    addToHistory,
    clearHistory,
    deleteHistoryItem,
    getFilteredHistory
  }
}
