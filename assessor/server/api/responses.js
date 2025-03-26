/**
 * Response API endpoints
 */

const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');

/**
 * Save a response
 * POST /api/response/save
 */
router.post('/save', (req, res) => {
  try {
    const { sessionId, questionId, responseValue, responseType, fieldName } = req.body;
    
    // Validate required fields
    if (!sessionId || !questionId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['sessionId', 'questionId']
      });
    }
    
    // Get session
    const session = sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Create response object
    const responseData = {
      questionId,
      responseValue,
      responseType,
      fieldName
    };
    
    // Save response and determine next question
    const result = sessionService.saveResponse(sessionId, responseData);
    
    res.json(result);
  } catch (error) {
    logger.error(`Error saving response: ${error.message}`);
    res.status(500).json({ error: 'Failed to save response' });
  }
});

/**
 * Get all responses for a session
 * GET /api/response/:sessionId
 */
router.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      sessionId,
      responses: session.responses
    });
  } catch (error) {
    logger.error(`Error getting responses: ${error.message}`);
    res.status(500).json({ error: 'Failed to get responses' });
  }
});

module.exports = router;