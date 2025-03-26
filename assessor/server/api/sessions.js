/**
 * Session API endpoints
 */

const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');

/**
 * Create a new session
 * POST /api/session/create
 */
router.post('/create', (req, res) => {
  try {
    // Extract metadata from request
    const metadata = {
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || req.headers.referrer
    };
    
    // Create a new session
    const session = sessionService.createSession(metadata);
    
    // Return session ID and questions
    res.json({
      sessionId: session.id,
      questions: sessionService.getQuestions()
    });
  } catch (error) {
    logger.error(`Error creating session: ${error.message}`);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * Get session status
 * GET /api/session/:sessionId
 */
router.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session.toJSON());
  } catch (error) {
    logger.error(`Error getting session: ${error.message}`);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * Get full session state for recovery
 * GET /api/session/:sessionId/state
 */
router.get('/:sessionId/state', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Return full session state for recovery
    res.json({
      ...session.toJSON(),
      questions: sessionService.getQuestions()
    });
  } catch (error) {
    logger.error(`Error getting session state: ${error.message}`);
    res.status(500).json({ error: 'Failed to get session state' });
  }
});

/**
 * Ping to keep session active
 * POST /api/session/:sessionId/ping
 */
router.post('/:sessionId/ping', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionService.pingSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session is expired based on server policy
    if (session.isExpired()) {
      return res.status(401).json({ 
        error: 'Session expired',
        isExpired: true
      });
    }
    
    res.json({
      success: true,
      sessionId: session.id,
      lastActivity: session.lastActivity
    });
  } catch (error) {
    logger.error(`Error pinging session: ${error.message}`);
    res.status(500).json({ error: 'Failed to ping session' });
  }
});

/**
 * Complete a session
 * POST /api/session/:sessionId/complete
 */
router.post('/:sessionId/complete', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    session.complete();
    
    res.json({
      success: true,
      sessionId: session.id,
      completedAt: session.completedAt
    });
  } catch (error) {
    logger.error(`Error completing session: ${error.message}`);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

/**
 * Get results for a completed session
 * GET /api/session/:sessionId/results
 */
router.get('/:sessionId/results', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const results = sessionService.generateResults(sessionId);
    res.json(results);
  } catch (error) {
    logger.error(`Error generating results: ${error.message}`);
    
    if (error.message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (error.message === 'Assessment not yet complete') {
      return res.status(400).json({ error: 'Assessment not yet complete' });
    }
    
    res.status(500).json({ error: 'Failed to generate results' });
  }
});

module.exports = router;