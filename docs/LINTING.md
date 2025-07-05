# Code Style and Linting Guide

This project uses ESLint and Prettier to maintain consistent code style and catch potential issues.

## Tools

- **ESLint**: JavaScript/TypeScript linter
- **Prettier**: Code formatter
- **EditorConfig**: Maintains consistent coding styles across different editors

## Setup

All dependencies are automatically installed when you run `npm install`.

### VS Code Setup

1. Install recommended extensions (you'll be prompted when opening the project)
2. Settings are pre-configured in `.vscode/settings.json`

### Other Editors

1. Install EditorConfig plugin for your editor
2. Configure ESLint and Prettier plugins according to your editor's documentation

## Available Scripts

```bash
# Check for linting issues
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix

# Format all code
npm run format

# Check if code is formatted correctly
npm run format:check
```

## Configuration Files

- `.editorconfig` - Basic editor settings (indentation, line endings, etc.)
- `.eslintrc.json` - ESLint rules for TypeScript and React
- `.prettierrc.json` - Prettier formatting rules
- `.prettierignore` - Files to exclude from formatting

## Rules Overview

### Code Style
- 2 spaces for indentation
- Single quotes for strings
- No semicolons
- LF line endings
- Trailing commas: none
- Max line width: 100 characters

### TypeScript
- Explicit `any` generates warnings
- Unused variables generate warnings (except those prefixed with `_`)
- Type checking is enforced

### React
- React import not required (React 17+)
- PropTypes disabled (using TypeScript)
- Hooks rules enforced

## Pre-commit Hook (Optional)

To ensure code quality before commits, you can set up a pre-commit hook:

```bash
npx husky-init && npm install
npx husky add .husky/pre-commit "npm run lint && npm run format:check"
```

## Troubleshooting

### ESLint not working
- Ensure your editor's ESLint plugin is enabled
- Restart your editor
- Check that `node_modules` is installed

### Prettier conflicts
- Prettier rules take precedence over ESLint style rules
- Use `npm run format` to fix formatting issues

### Line ending issues
- Ensure Git is configured to handle line endings: `git config core.autocrlf false`
- Run `npm run format` to fix line endings
