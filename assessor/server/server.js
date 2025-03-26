/**
 * Server entry point for assessment chat application
 */

const app = require('./app');
const logger = require('./utils/logger');

// Define port to run server on
const PORT = process.env.PORT || 3000;

// Add uncaught exception handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the server
try {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`http://localhost:${PORT}`);
  });
} catch (error) {
  logger.error('Failed to start server:', error);
}