# Assessor App Development Guide

## Build Commands
- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with hot reloading
- `npm test` - Run all tests
- `npm test -- tests/specificTest.js` - Run a specific test file
- `npm test -- -t "test name"` - Run tests matching a specific name

## Code Style Guidelines
- **Philosophy**: design for serendipity, follow best practices, favor modularity and loose-coupling
- **Formatting**: Use 2-space indentation, single quotes for strings
- **Naming**: Use camelCase for variables and functions, PascalCase for classes and filenames
- **Error Handling**: Use try/catch blocks for async functions, log errors with the logger utility
- **Imports**: Group imports (Node built-ins first, then external libraries, then local modules)
- **Logging**: Use the centralized logger from `server/utils/logger.js` instead of console.log
- **Types**: Document function parameters and return types with JSDoc comments
- **APIs**: Follow RESTful practices for endpoints, with consistent response formats
- **Security**: Validate all user inputs, sanitize data before storage or display

## Testing
- Write unit tests for all utility functions and API endpoints
- Mock external dependencies in tests
- Structure tests in a describe/it pattern for readability