# DataPup Architecture

This document describes the architecture and project structure of DataPup.

## Overview

DataPup uses Electron IPC for communication between the main process and renderer:

- **Main Process**: Handles database connections, query execution, and system operations
- **Renderer Process**: React app with Radix UI components for the user interface
- **IPC Bridge**: Secure communication channel for database operations

## Project Structure

```
data-pup/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main entry point & IPC handlers
│   │   ├── database/   # Database connection logic
│   │   │   ├── base.ts       # Base database class
│   │   │   ├── clickhouse.ts # ClickHouse implementation
│   │   │   ├── factory.ts    # Database factory
│   │   │   └── manager.ts    # Connection manager
│   │   ├── llm/        # AI/LLM integration
│   │   │   ├── langchainAgent.ts # LangChain agent setup
│   │   │   └── tools/        # AI tools for SQL generation
│   │   └── utils/      # Utilities (logger, etc.)
│   ├── preload/        # Preload scripts for IPC
│   └── renderer/       # React application
│       ├── components/
│       │   ├── AIAssistant/        # AI chat interface
│       │   ├── ActiveConnectionLayout/ # Main connected view
│       │   ├── ConnectionCard/     # Connection display cards
│       │   ├── DatabaseExplorer/   # Database tree view
│       │   ├── QueryHistory/       # Query history panel
│       │   ├── QueryTabs/          # Tab management
│       │   ├── QueryWorkspace/     # Query workspace container
│       │   ├── TableView/          # Results table view
│       │   ├── ThemeSwitcher/      # Theme selection
│       │   └── ui/                 # Reusable UI components
│       ├── hooks/      # Custom React hooks
│       ├── lib/        # Libraries and utilities
│       │   └── theme/  # Theme system
│       ├── types/      # TypeScript type definitions
│       ├── App.tsx     # Main App component
│       ├── main.tsx    # React entry point
│       └── index.html  # HTML template
├── docs/               # Documentation
├── build/              # Build configuration and assets
├── CONTRIBUTING.md     # Contribution guidelines
├── LICENSE            # MIT license
├── package.json       # Project dependencies
└── README.md          # Main readme file
```

## Key Components

### Main Process (src/main/)

The main process is responsible for:
- Managing database connections
- Executing queries against connected databases
- Handling system-level operations
- Managing the application lifecycle

### Renderer Process (src/renderer/)

The renderer process contains the React application with:
- UI components built with Radix UI
- State management for the application
- Query editor and results display
- Theme management system

### IPC Communication

Communication between processes uses Electron's IPC (Inter-Process Communication):
- Typed IPC handlers ensure type safety
- Secure bridge prevents direct access to system resources
- Asynchronous operations for non-blocking UI

## Database Architecture

### Base Database Class
All database implementations extend from a common base class that defines:
- Connection management
- Query execution interface
- Schema discovery methods
- Error handling

### Database Implementations
Each supported database has its own implementation:
- **ClickHouse**: Optimized for OLAP queries and large datasets
- **PostgreSQL**: (Coming soon) Full SQL support with extensions
- **MySQL**: (Coming soon) Wide compatibility with MySQL/MariaDB
- **SQLite**: (Coming soon) Local file-based database support

## AI Integration

The AI assistant is powered by LangChain and provides:
- Natural language to SQL conversion
- Query optimization suggestions
- Schema-aware completions
- Error explanation and fixes

## Security Considerations

- Credentials are stored securely using Electron's safeStorage
- Database connections are isolated in the main process
- No direct database access from the renderer
- Input sanitization for all user queries

## Performance Optimizations

- Virtual scrolling for large result sets
- Lazy loading of database schemas
- Query result pagination
- Efficient IPC message passing
- Monaco editor for syntax highlighting without performance overhead

## Future Architecture Plans

- Plugin system for custom database adapters
- Query result caching layer
- Collaborative features with WebSocket support
- Advanced query profiling and optimization tools