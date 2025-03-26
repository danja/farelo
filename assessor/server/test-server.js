/**
 * Simplified test server to verify basic functionality
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Create Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// In-memory session storage
const sessions = new Map();

// Sample question data
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
    id: '3a',
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
    id: '4',
    text: 'Would you like to tell us more about your health goals?',
    isCustomInput: true,
    inputType: 'textarea',
    fieldName: 'health_goals',
    placeholder: 'Share your health goals here...',
    buttonText: 'Submit',
    tagClass: 'health-goals-section'
  }
];

/**
 * Create a new session - primary endpoint
 */
app.post('/api/session/create', (req, res) => {
  console.log('Creating new session');
  const sessionId = uuidv4();
  
  // Create a new session with enhanced data
  const sessionData = {
    id: sessionId,
    startTime: Date.now(),
    lastActivity: Date.now(),
    responses: [],
    currentQuestionIndex: 0,
    completedAt: null
  };
  
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
 * Save user response and determine next question
 */
app.post('/api/response/save', (req, res) => {
  const { sessionId, questionId, responseValue, responseType, fieldName } = req.body;
  
  console.log('Saving response:', { sessionId, questionId, responseValue, responseType, fieldName });
  
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
  
  // Add branching logic for health rating question
  if (questionId === '2') {
    // Health rating question
    if (responseValue === '2a' || responseValue === '2b') {
      // Excellent or Good health -> go to exercise question
      nextQuestionIndex = questionBank.findIndex(q => q.id === '3a');
      console.log('Branching to exercise question (index:', nextQuestionIndex, ')');
    } else {
      // For Fair or Poor, we would normally branch to health concerns
      // For the test server, we'll just go to the next question
      nextQuestionIndex = questionBank.findIndex(q => q.id === '4');
      console.log('Branching to health goals (index:', nextQuestionIndex, ')');
    }
  }
  
  console.log('Next question index:', nextQuestionIndex);
  
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

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});