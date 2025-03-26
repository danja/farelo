/**
 * Session Service
 * Manages session operations and persistence
 */

const Session = require('../models/session');
const logger = require('../utils/logger');

// In-memory session storage
// In a production app, this would be replaced with a database
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

/**
 * Create a new session
 * @param {Object} metadata - Additional session metadata
 * @returns {Session} New session instance
 */
function createSession(metadata = {}) {
  const session = new Session(metadata);
  sessions.set(session.id, session);
  logger.debug(`Created new session: ${session.id}`);
  return session;
}

/**
 * Get a session by ID
 * @param {String} sessionId - Session ID
 * @returns {Session|null} Session instance or null if not found
 */
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    return null;
  }
  return sessions.get(sessionId);
}

/**
 * Update session activity
 * @param {String} sessionId - Session ID
 * @returns {Session|null} Updated session or null if not found
 */
function pingSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) {
    return null;
  }
  
  session.ping();
  sessions.set(sessionId, session);
  return session;
}

/**
 * Get all available questions
 * @returns {Array} Array of question objects
 */
function getQuestions() {
  return questionBank;
}

/**
 * Save a response and determine next question
 * @param {String} sessionId - Session ID
 * @param {Object} responseData - Response data
 * @returns {Object} Result with next question index
 */
function saveResponse(sessionId, responseData) {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Save the response
  session.addResponse(responseData);
  
  // Determine next question based on branching logic
  let nextQuestionIndex = session.currentQuestionIndex + 1;
  
  // Example branching logic
  if (responseData.questionId === '2') {
    // Health rating question
    if (responseData.responseValue === '2a' || responseData.responseValue === '2b') {
      // Excellent or Good health -> go to exercise question
      nextQuestionIndex = questionBank.findIndex(q => q.id === '3a');
    } else {
      // Fair or Poor health -> go to health concerns question
      nextQuestionIndex = questionBank.findIndex(q => q.id === '3b');
    }
  } else if (responseData.questionId === '3a' || responseData.questionId === '3b') {
    // After either branch, go to health goals question
    nextQuestionIndex = questionBank.findIndex(q => q.id === '4');
  }
  
  // Update session
  session.setQuestionIndex(nextQuestionIndex);
  
  // Check if assessment is complete
  if (nextQuestionIndex >= questionBank.length) {
    session.complete();
  }
  
  // Save updated session
  sessions.set(sessionId, session);
  
  return {
    nextQuestionIndex,
    success: true
  };
}

/**
 * Generate results based on session responses
 * @param {String} sessionId - Session ID
 * @returns {Object} Results summary
 */
function generateResults(sessionId) {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (!session.completedAt) {
    throw new Error('Assessment not yet complete');
  }
  
  // Generate a summary based on responses
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
  
  return summary;
}

/**
 * Clean up expired sessions
 * @param {Number} maxIdleTime - Maximum idle time in milliseconds
 * @returns {Number} Number of sessions removed
 */
function cleanupExpiredSessions(maxIdleTime = 2 * 60 * 60 * 1000) { // Default 2 hours
  let expiredCount = 0;
  
  sessions.forEach((session, sessionId) => {
    if (session.isExpired(maxIdleTime)) {
      sessions.delete(sessionId);
      expiredCount++;
    }
  });
  
  logger.info(`Cleaned up ${expiredCount} expired sessions. Active sessions: ${sessions.size}`);
  return expiredCount;
}

/**
 * Calculate health score based on responses
 * @param {Array} responses - User responses
 * @returns {Number} Health score
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
 * Generate health recommendations based on responses
 * @param {Array} responses - User responses
 * @returns {Array} Recommendations
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

// Start periodic cleanup
setInterval(() => cleanupExpiredSessions(), 60 * 60 * 1000); // Run every hour

module.exports = {
  createSession,
  getSession,
  pingSession,
  getQuestions,
  saveResponse,
  generateResults,
  cleanupExpiredSessions
};