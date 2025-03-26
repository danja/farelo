/**
 * Session model
 * Handles session data structure and methods
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class Session {
  /**
   * Create a new session
   * @param {Object} data - Initial session data
   */
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.startTime = data.startTime || Date.now();
    this.lastActivity = data.lastActivity || Date.now();
    this.responses = data.responses || [];
    this.currentQuestionIndex = data.currentQuestionIndex || 0;
    this.completedAt = data.completedAt || null;
    this.metadata = {
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      referrer: data.referrer || null
    };
  }
  
  /**
   * Record user activity to keep session alive
   */
  ping() {
    this.lastActivity = Date.now();
    return this;
  }
  
  /**
   * Add a response to the session
   * @param {Object} response - User response data
   */
  addResponse(response) {
    this.responses.push({
      ...response,
      timestamp: Date.now()
    });
    return this;
  }
  
  /**
   * Set the current question index
   * @param {Number} index - Question index
   */
  setQuestionIndex(index) {
    this.currentQuestionIndex = index;
    return this;
  }
  
  /**
   * Mark session as completed
   */
  complete() {
    this.completedAt = Date.now();
    return this;
  }
  
  /**
   * Check if session is active
   * @param {Number} maxIdleTime - Maximum idle time in milliseconds
   * @returns {Boolean} Whether session is active
   */
  isActive(maxIdleTime = 30 * 60 * 1000) { // Default 30 minutes
    const idleTime = Date.now() - this.lastActivity;
    return idleTime < maxIdleTime && !this.completedAt;
  }
  
  /**
   * Check if session is expired
   * @param {Number} maxIdleTime - Maximum idle time in milliseconds
   * @returns {Boolean} Whether session is expired
   */
  isExpired(maxIdleTime = 30 * 60 * 1000) { // Default 30 minutes
    return !this.isActive(maxIdleTime);
  }
  
  /**
   * Convert session to a plain object for serialization
   * @returns {Object} Session data object
   */
  toJSON() {
    return {
      id: this.id,
      startTime: this.startTime,
      lastActivity: this.lastActivity,
      responses: this.responses,
      currentQuestionIndex: this.currentQuestionIndex,
      completedAt: this.completedAt,
      metadata: this.metadata,
      isExpired: this.isExpired()
    };
  }
}

module.exports = Session;