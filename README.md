# 🐶 Data-Pup

> A modern, AI-assisted, cross-platform database client built with Electron, React, and Radix UI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Data-Pup is an open-source database client designed to make database management intuitive and enjoyable. With AI-powered query assistance and a beautiful, accessible interface, it's the database tool that developers actually want to use.

## 📸 Screenshots

### AI-Powered Query Assistant
<img src="docs/images/ai-assistant-screenshot.png" alt="AI Assistant helping write SQL queries" width="800">

*Get intelligent help writing SQL queries with the built-in AI assistant*

### Advanced Query Filtering
<img src="docs/images/query-filter-screenshot.png" alt="Query results with advanced filtering" width="800">

*Filter and explore your data with powerful, intuitive controls*

### Beautiful Themes
<img src="docs/images/themes-screenshot.png" alt="Theme switcher showing multiple theme options" width="800">

*Choose from multiple beautiful themes including Light, Dark, and colorful variants*

## ✨ Features

- 🤖 **AI-Powered Assistant** - Get help writing SQL queries with intelligent suggestions
- 🔌 **Multi-Database Support** - Connect to PostgreSQL, MySQL, SQLite, ClickHouse, and more
- 🎨 **Beautiful Themes** - Multiple themes including Light, Dark, Dark Violet, Dark Green, Light Pink, and High Contrast
- 🔍 **Advanced Filtering** - Powerful query result filtering with intuitive controls
- 🚀 **Fast & Responsive** - Built with Electron IPC for optimal performance
- 🔒 **Secure** - Safe credential handling with no exposed ports
- 📦 **Cross-platform** - Works on macOS, Windows, and Linux

## Development

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Create distributable:
   ```bash
   npm run dist
   ```

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
├── CONTRIBUTING.md     # Contribution guidelines
├── LICENSE            # MIT license
├── package.json       # Project dependencies
└── README.md          # This file
```

## Architecture

Data-Pup uses Electron IPC for communication between the main process and renderer:

- **Main Process**: Handles database connections, query execution, and system operations
- **Renderer Process**: React app with Radix UI components for the user interface
- **IPC Bridge**: Secure communication channel for database operations

## Next Steps

- Add more connectors like MySQL, PostgreSQL, MongoDB, and more
- Improve SQL Editor with advanced features and syntax highlighting
- Implement query history and saved queries functionality

## 🤝 Contributing

We love your input! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.


⭐ **If you find Data-Pup useful, please consider giving it a star on GitHub!** ⭐

## 📝 License

This project is [MIT](LICENSE) licensed - use it however you want! See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [Radix UI](https://www.radix-ui.com/)
- Bundled with [Vite](https://vitejs.dev/)
- AI assistance powered by [LangChain](https://www.langchain.com/)

## 📬 Contact

Have questions? Open an issue or reach out to the community!

---

<p align="center">Made with ❤️ by the open source community</p>
