/**
 * SessionManager.js
 * Handles chat session management with timeout detection, persistence, and recovery
 */

import EventBus from './eventBus.js';
import ApiClient from './api.js';

class SessionManager {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || window.location.origin;
    this.sessionId = null;
    this.timeoutMinutes = options.timeoutMinutes || 30;
    this.timeoutWarningMinutes = options.timeoutWarningMinutes || 1;
    this.autoReconnect = options.autoReconnect !== false;
    
    this.timeoutTimer = null;
    this.warningTimer = null;
    this.pingInterval = null;
    
    this.storageKey = 'assessment_session';
    this.eventBus = options.eventBus || new EventBus();
    this.api = options.apiClient || new ApiClient(this.baseUrl);
    
    // Bind methods
    this.resetTimer = this.resetTimer.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    // Initialize activity listeners
    this.initActivityTracking();
  }
  
  /**
   * Initialize session from storage or create new
   * @returns {Promise<Object>} Session data
   */
  async initialize() {
    try {
      // Try to restore existing session
      const savedSession = this.loadFromStorage();
      
      if (savedSession && savedSession.sessionId) {
        // Verify the session is still valid on the server
        try {
          const sessionData = await this.api.getSession(savedSession.sessionId);
          
          // If session is valid and not expired
          if (!sessionData.isExpired) {
            this.sessionId = savedSession.sessionId;
            this.startTimers();
            this.startPinging();
            
            this.eventBus.emit('session:recovered', {
              sessionId: this.sessionId,
              sessionData
            });
            
            return {
              sessionId: this.sessionId,
              isRecovered: true,
              sessionData
            };
          }
        } catch (error) {
          console.warn('Failed to verify existing session:', error);
          // Continue to create a new session
        }
      }
      
      // Create a new session
      return this.createNewSession();
    } catch (error) {
      this.eventBus.emit('session:error', {
        error,
        message: 'Failed to initialize session'
      });
      throw error;
    }
  }
  
  /**
   * Create a new session with the server
   * @returns {Promise<Object>} New session data
   */
  async createNewSession() {
    try {
      const data = await this.api.createSession();
      this.sessionId = data.sessionId;
      
      // Save session to storage
      this.saveToStorage({
        sessionId: this.sessionId,
        timestamp: Date.now()
      });
      
      // Start timers
      this.startTimers();
      this.startPinging();
      
      // Add console logging for debugging
      console.log('Session created:', data);
      
      this.eventBus.emit('session:created', {
        sessionId: this.sessionId,
        sessionData: data
      });
      
      return {
        sessionId: this.sessionId,
        isRecovered: false,
        sessionData: data
      };
    } catch (error) {
      console.error('Failed to create session:', error);
      this.eventBus.emit('session:error', {
        error,
        message: 'Failed to create new session'
      });
      throw error;
    }
  }
  
  /**
   * Initialize user activity tracking
   */
  initActivityTracking() {
    // Track user interaction events
    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, this.resetTimer);
    });
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Track beforeunload to save session state
    window.addEventListener('beforeunload', () => {
      if (this.sessionId) {
        this.saveToStorage({
          sessionId: this.sessionId,
          timestamp: Date.now(),
          lastPath: window.location.pathname
        });
      }
    });
  }
  
  /**
   * Start automatic session pinging
   */
  startPinging() {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Ping every 2 minutes to keep session alive
    this.pingInterval = setInterval(async () => {
      if (this.sessionId) {
        try {
          await this.api.pingSession(this.sessionId);
          this.eventBus.emit('session:ping', { success: true });
        } catch (error) {
          this.eventBus.emit('session:ping', { success: false, error });
          
          if (error.status === 404 || error.status === 401) {
            this.handleSessionExpired();
          }
        }
      }
    }, 2 * 60 * 1000); // 2 minutes
  }
  
  /**
   * Start session timeout timers
   */
  startTimers() {
    this.resetTimer();
  }
  
  /**
   * Reset timeout timers
   */
  resetTimer() {
    // Clear existing timers
    clearTimeout(this.warningTimer);
    clearTimeout(this.timeoutTimer);
    
    // Set warning timer
    const warningTime = (this.timeoutMinutes - this.timeoutWarningMinutes) * 60 * 1000;
    this.warningTimer = setTimeout(() => {
      this.eventBus.emit('session:warning', { 
        timeRemaining: this.timeoutWarningMinutes * 60,
        sessionId: this.sessionId
      });
    }, warningTime);
    
    // Set timeout timer
    const timeoutTime = this.timeoutMinutes * 60 * 1000;
    this.timeoutTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeoutTime);
  }
  
  /**
   * Handle visibility change events
   */
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Page is now visible - check session validity
      this.verifySession();
    }
  }
  
  /**
   * Verify if the current session is still valid
   * @returns {Promise<boolean>} Whether session is valid
   */
  async verifySession() {
    if (!this.sessionId) return false;
    
    try {
      const data = await this.api.getSession(this.sessionId);
      
      if (data.isExpired) {
        this.handleSessionExpired();
        return false;
      }
      
      // Session is valid, reset timers
      this.resetTimer();
      return true;
    } catch (error) {
      this.handleSessionExpired();
      return false;
    }
  }
  
  /**
   * Handle session timeout
   */
  handleSessionTimeout() {
    this.eventBus.emit('session:timeout', { sessionId: this.sessionId });
    
    // Attempt to ping the server to extend the session
    this.api.pingSession(this.sessionId)
      .then(() => {
        // Session was successfully extended
        this.resetTimer();
        this.eventBus.emit('session:reconnect', { sessionId: this.sessionId });
      })
      .catch(() => {
        this.handleSessionExpired();
      });
  }
  
  /**
   * Handle session expiration
   */
  handleSessionExpired() {
    this.clearTimers();
    this.removeFromStorage();
    this.eventBus.emit('session:expired', { sessionId: this.sessionId });
    this.sessionId = null;
  }
  
  /**
   * Clear all timers
   */
  clearTimers() {
    clearTimeout(this.warningTimer);
    clearTimeout(this.timeoutTimer);
    clearInterval(this.pingInterval);
  }
  
  /**
   * Save response to the server
   * @param {Object} responseData - The response data to save
   * @returns {Promise<Object>} Response from server
   */
  async saveResponse(responseData) {
    if (!this.sessionId) {
      throw new Error('No active session');
    }
    
    try {
      const data = await this.api.saveResponse({
        ...responseData,
        sessionId: this.sessionId
      });
      
      // Reset timers on successful interaction
      this.resetTimer();
      
      return data;
    } catch (error) {
      this.eventBus.emit('session:error', {
        error,
        message: 'Failed to save response'
      });
      throw error;
    }
  }
  
  /**
   * Complete the session
   * @returns {Promise<Object>} Response from server
   */
  async completeSession() {
    if (!this.sessionId) {
      throw new Error('No active session');
    }
    
    try {
      const data = await this.api.completeSession(this.sessionId);
      this.eventBus.emit('session:completed', { sessionId: this.sessionId });
      return data;
    } catch (error) {
      this.eventBus.emit('session:error', {
        error,
        message: 'Failed to complete session'
      });
      throw error;
    }
  }
  
  /**
   * Get results for the session
   * @returns {Promise<Object>} Session results
   */
  async getResults() {
    if (!this.sessionId) {
      throw new Error('No active session');
    }
    
    try {
      return await this.api.getResults(this.sessionId);
    } catch (error) {
      this.eventBus.emit('session:error', {
        error,
        message: 'Failed to get results'
      });
      throw error;
    }
  }
  
  /**
   * Save session data to localStorage
   * @param {Object} data Data to save
   */
  saveToStorage(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save session to storage:', error);
    }
  }
  
  /**
   * Load session data from localStorage
   * @returns {Object|null} Session data or null if not found
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      
      const session = JSON.parse(data);
      
      // Check if session is too old (> 1 day)
      const maxAge = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      if (Date.now() - session.timestamp > maxAge) {
        this.removeFromStorage();
        return null;
      }
      
      return session;
    } catch (error) {
      console.warn('Failed to load session from storage:', error);
      return null;
    }
  }
  
  /**
   * Remove session data from localStorage
   */
  removeFromStorage() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to remove session from storage:', error);
    }
  }
  
  /**
   * Get current session ID
   * @returns {String|null} Current session ID or null if not active
   */
  getSessionId() {
    return this.sessionId;
  }
  
  /**
   * Check if session is active
   * @returns {Boolean} Whether session is active
   */
  isActive() {
    return !!this.sessionId;
  }
  
  /**
   * Cleanup and destroy session manager
   */
  destroy() {
    this.clearTimers();
    
    // Remove event listeners
    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.removeEventListener(event, this.resetTimer);
    });
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

export default SessionManager;