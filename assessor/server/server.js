/**
 * Server entry point for assessment chat application
 */

const app = require('./app');
const logger = require('./utils/logger');

// Define port to run server on
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`http://localhost:${PORT}`);
});