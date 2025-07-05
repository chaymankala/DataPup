# 🐶 Data-Pup

> A modern, AI-assisted, cross-platform database client built with Electron, React, and Radix UI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Data-Pup is an open-source database client designed to make database management intuitive and enjoyable. With AI-powered query assistance and a beautiful, accessible interface, it's the database tool that developers actually want to use.

## ✨ Features

- 🔌 Connect to multiple database types (PostgreSQL, MySQL, SQLite, ClickHouse)
- 🎨 Modern UI with Radix components and dark mode
- 🚀 Fast and responsive with Electron IPC
- 🔒 Secure credential handling
- 📦 Cross-platform (macOS, Windows, Linux)

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
│   │   ├── index.ts    # Main entry point
│   │   └── database/   # Database connection logic
│   ├── preload/        # Preload scripts for IPC
│   └── renderer/       # React application
│       ├── src/
│       │   ├── components/
│       │   │   ├── Layout/         # App layout components
│       │   │   ├── DatabaseConnection/  # Connection dialog
│       │   │   └── ui/            # Reusable UI components
│       │   └── App.tsx
│       └── index.html
├── electron.vite.config.ts
└── package.json
```

## Architecture

Data-Pup uses Electron IPC for communication between the main process and renderer:

- **Main Process**: Handles database connections, query execution, and system operations
- **Renderer Process**: React app with Radix UI components for the user interface
- **IPC Bridge**: Secure communication channel for database operations

## Next Steps

- Add database drivers (pg, mysql2, etc.)
- Implement query editor with syntax highlighting
- Add result visualization components
- Create saved queries functionality
- Implement AI-assisted query generation

## 🤝 Contributing

We love your input! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

## 📝 License

This project is [MIT](LICENSE) licensed - use it however you want! See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [Radix UI](https://www.radix-ui.com/)
- Bundled with [Vite](https://vitejs.dev/)

## 📬 Contact

Have questions? Open an issue or reach out to the community!

---

<p align="center">Made with ❤️ by the open source community</p>