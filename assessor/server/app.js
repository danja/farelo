/**
 * Assessment Chat Backend
 * Express server for chat-based assessment flow
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// In-memory session storage
const sessions = new Map();

// Sample question data with branching logic
const questionBank = [
  {
    id: '1',
    text: 'Welcome to our assessment. Please answer a few questions to help us understand your situation better.',
    options: [
      { id: '1a', text: 'OK, let\'s begin' }
    ],
    optionType: 'button',
    tagClass: 'intro-section'
  },
  {
    id: '2',
    text: 'How would you rate your overall health?',
    options: [
      { id: '2a', text: 'Excellent' },
      { id: '2b', text: 'Good' },
      { id: '2c', text: 'Fair' },
      { id: '2d', text: 'Poor' }
    ],
    optionType: 'button',
    tagClass: 'health-rating'
  },
  {
    id: '3a', // Branched from Excellent/Good health
    text: 'Great! Do you exercise regularly?',
    options: [
      { id: '3a1', text: 'Yes, frequently' },
      { id: '3a2', text: 'Sometimes' },
      { id: '3a3', text: 'Rarely' }
    ],
    optionType: 'button',
    tagClass: 'exercise-section'
  },
  {
    id: '3b', // Branched from Fair/Poor health
    text: 'What health concerns do you currently have?',
    options: [
      { id: '3b1', text: 'Chronic pain' },
      { id: '3b2', text: 'Fatigue' },
      { id: '3b3', text: 'Mental health' },
      { id: '3b4', text: 'Other conditions' }
    ],
    optionType: 'checkbox',
    buttonText: 'Skip',
    nextButtonText: 'Continue',
    tagClass: 'health-concerns'
  },
  {
    id: '4',
    text: 'Would you like to tell us more about your health goals?',
    isCustomInput: true,
    inputType: 'textarea',
    fieldName: 'health_goals',
    placeholder: 'Share your health goals here...',
    buttonText: 'Submit',
    tagClass: 'health-goals-section'
  },
  {
    id: '5',
    text: 'What\'s your email address so we can send you personalized recommendations?',
    isCustomInput: true,
    inputType: 'text',
    fieldName: 'email',
    placeholder: 'your@email.com',
    tagClass: 'contact-info'
  },
  {
    id: '6',
    text: 'Thank you for completing the assessment! We\'ll analyze your responses and provide personalized recommendations.',
    options: [
      { id: '6a', text: 'Learn more about our services', url: 'https://example.com/services' },
      { id: '6b', text: 'No thanks, I\'m done' }
    ],
    optionType: 'url-buttons',
    tagClass: 'completion-section'
  }
];

// Session creation endpoint moved to end of file

/**
 * Save user response and determine next question
 */
app.post('/api/response/save', (req, res) => {
  const { sessionId, questionId, responseValue, responseType, fieldName } = req.body;
  
  // Validate session
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = sessions.get(sessionId);
  
  // Save the response
  session.responses.push({
    questionId,
    responseValue,
    responseType,
    fieldName,
    timestamp: new Date()
  });
  
  // Determine next question based on branching logic
  let nextQuestionIndex = session.currentQuestionIndex + 1;
  
  // Example branching logic
  if (questionId === '2') {
    // Health rating question
    if (responseValue === '2a' || responseValue === '2b') {
      // Excellent or Good health -> go to exercise question
      nextQuestionIndex = questionBank.findIndex(q => q.id === '3a');
    } else {
      // Fair or Poor health -> go to health concerns question
      nextQuestionIndex = questionBank.findIndex(q => q.id === '3b');
    }
  } else if (questionId === '3a' || questionId === '3b') {
    // After either branch, go to health goals question
    nextQuestionIndex = questionBank.findIndex(q => q.id === '4');
  }
  
  // Update session
  session.currentQuestionIndex = nextQuestionIndex;
  
  // Check if assessment is complete
  if (nextQuestionIndex >= questionBank.length) {
    session.completedAt = new Date();
  }
  
  // Save updated session
  sessions.set(sessionId, session);
  
  // Return the next question index
  res.json({
    nextQuestionIndex,
    success: true
  });
});

/**
 * Get session status
 */
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = sessions.get(sessionId);
  
  res.json({
    sessionId: session.id,
    startTime: session.startTime,
    currentQuestionIndex: session.currentQuestionIndex,
    responseCount: session.responses.length,
    isComplete: session.completedAt !== null,
    completedAt: session.completedAt
  });
});

/**
 * End and complete a session
 */
app.post('/api/session/:sessionId/complete', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = sessions.get(sessionId);
  session.completedAt = new Date();
  sessions.set(sessionId, session);
  
  res.json({
    success: true,
    sessionId,
    completedAt: session.completedAt
  });
});

/**
 * Generate a results summary based on session responses
 */
app.get('/api/session/:sessionId/results', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = sessions.get(sessionId);
  
  if (!session.completedAt) {
    return res.status(400).json({ error: 'Assessment not yet complete' });
  }
  
  // Generate a summary based on responses
  // This would be a more complex analysis in a real application
  const summary = {
    sessionId: session.id,
    completedAt: session.completedAt,
    responseCount: session.responses.length,
    analysisResults: [
      {
        category: 'Overall Health',
        score: calculateHealthScore(session.responses),
        recommendations: generateHealthRecommendations(session.responses)
      }
    ]
  };
  
  res.json(summary);
});

/**
 * Helper function to calculate health score based on responses
 */
function calculateHealthScore(responses) {
  // This would be more sophisticated in a real application
  const healthRating = responses.find(r => r.questionId === '2');
  
  if (!healthRating) return 50; // Default score
  
  switch (healthRating.responseValue) {
    case '2a': return 90; // Excellent
    case '2b': return 75; // Good
    case '2c': return 50; // Fair
    case '2d': return 25; // Poor
    default: return 50;
  }
}

/**
 * Helper function to generate recommendations based on responses
 */
function generateHealthRecommendations(responses) {
  const recommendations = [];
  
  // Health rating recommendations
  const healthRating = responses.find(r => r.questionId === '2');
  if (healthRating) {
    if (healthRating.responseValue === '2c' || healthRating.responseValue === '2d') {
      recommendations.push('Consider scheduling a check-up with your healthcare provider');
    }
  }
  
  // Exercise recommendations
  const exercise = responses.find(r => r.questionId === '3a');
  if (exercise) {
    if (exercise.responseValue === '3a3') {
      recommendations.push('Try to incorporate more physical activity into your daily routine');
    }
  }
  
  // Health concerns recommendations
  const concerns = responses.find(r => r.questionId === '3b');
  if (concerns && concerns.responseValue) {
    const selectedConcerns = concerns.responseValue.split(',');
    
    if (selectedConcerns.includes('3b1')) {
      recommendations.push('Consider pain management strategies and consult with a specialist');
    }
    
    if (selectedConcerns.includes('3b3')) {
      recommendations.push('Explore mental health resources and support options');
    }
  }
  
  // Add generic recommendation if none specific
  if (recommendations.length === 0) {
    recommendations.push('Maintain your current health practices and stay active');
  }
  
  return recommendations;
}

// Export the app so it can be started by server.js
module.exports = app;

/**
 * Session management API endpoints for Express server
 */

// Add these endpoint functions to app.js

/**
 * Get full session state including history
 */
app.get('/api/session/:sessionId/state', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = sessions.get(sessionId);
  
  // Return full session state for recovery
  res.json({
    sessionId: session.id,
    startTime: session.startTime,
    currentQuestionIndex: session.currentQuestionIndex,
    responses: session.responses,
    questions: questionBank,
    isComplete: session.completedAt !== null,
    completedAt: session.completedAt
  });
});

/**
 * Ping to keep session active
 */
app.post('/api/session/:sessionId/ping', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = sessions.get(sessionId);
  
  // Check if session is expired (server-side timeout, e.g. 60 minutes)
  const maxSessionDuration = 60 * 60 * 1000; // 60 minutes
  if (Date.now() - session.startTime > maxSessionDuration) {
    return res.status(401).json({ 
      error: 'Session expired',
      isExpired: true
    });
  }
  
  // Update session activity timestamp
  session.lastActivity = Date.now();
  sessions.set(sessionId, session);
  
  res.json({
    success: true,
    sessionId,
    lastActivity: session.lastActivity
  });
});

/**
 * Clear expired sessions periodically
 */
function cleanupExpiredSessions() {
  console.log('Cleaning up expired sessions...');
  const now = Date.now();
  const maxIdleTime = 2 * 60 * 60 * 1000; // 2 hours idle timeout
  
  let expiredCount = 0;
  
  sessions.forEach((session, sessionId) => {
    // Check for idle timeout
    if (session.lastActivity && (now - session.lastActivity > maxIdleTime)) {
      sessions.delete(sessionId);
      expiredCount++;
    }
    
    // Check for very old sessions
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours total lifetime
    if (now - session.startTime > maxSessionAge) {
      sessions.delete(sessionId);
      expiredCount++;
    }
  });
  
  console.log(`Cleaned up ${expiredCount} expired sessions. Active sessions: ${sessions.size}`);
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

/**
 * Create a session object with full data
 */
function createSession(sessionId) {
  return {
    id: sessionId,
    startTime: Date.now(),
    lastActivity: Date.now(),
    responses: [],
    currentQuestionIndex: 0,
    completedAt: null,
    ipAddress: null,
    userAgent: null
  };
}

/**
 * Create a new session - primary endpoint
 */
app.post('/api/session/create', (req, res) => {
  console.log('Creating new session');
  const sessionId = uuidv4();
  
  // Create a new session with enhanced data
  const sessionData = createSession(sessionId);
  
  // Optionally capture client info for security/debugging
  if (req.headers['user-agent']) {
    sessionData.userAgent = req.headers['user-agent'];
  }
  
  if (req.headers['x-forwarded-for'] || req.socket.remoteAddress) {
    sessionData.ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  }
  
  // Store session
  sessions.set(sessionId, sessionData);
  
  // Log questions being returned
  console.log(`Session created with ID: ${sessionId}, returning ${questionBank.length} questions`);
  
  // Return session ID and first set of questions
  res.json({
    sessionId,
    questions: questionBank
  });
});