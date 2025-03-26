/**
 * API client for communication with the server
 */

class ApiClient {
  /**
   * Initialize API client
   * @param {String} baseUrl - Base URL for API requests
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl || window.location.origin;
  }
  
  /**
   * Make a request to the API
   * @param {String} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Default options
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    };
    
    // Merge options
    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Handle error responses
      if (!response.ok) {
        const error = new Error(data.error || 'API request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      return data;
    } catch (error) {
      // Enhance error with request details
      error.endpoint = endpoint;
      error.request = options;
      throw error;
    }
  }
  
  /**
   * Create a new session
   * @returns {Promise<Object>} New session data
   */
  async createSession() {
    return this.request('/api/session/create', {
      method: 'POST'
    });
  }
  
  /**
   * Get session data
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Session data
   */
  async getSession(sessionId) {
    return this.request(`/api/session/${sessionId}`);
  }
  
  /**
   * Get full session state including question history
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Complete session state
   */
  async getSessionState(sessionId) {
    return this.request(`/api/session/${sessionId}/state`);
  }
  
  /**
   * Ping to keep session alive
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Session status
   */
  async pingSession(sessionId) {
    return this.request(`/api/session/${sessionId}/ping`, {
      method: 'POST'
    });
  }
  
  /**
   * Complete a session
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Completion status
   */
  async completeSession(sessionId) {
    return this.request(`/api/session/${sessionId}/complete`, {
      method: 'POST'
    });
  }
  
  /**
   * Get session results
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Session results
   */
  async getResults(sessionId) {
    return this.request(`/api/session/${sessionId}/results`);
  }
  
  /**
   * Save a response
   * @param {Object} responseData - Response data
   * @returns {Promise<Object>} Response status
   */
  async saveResponse(responseData) {
    return this.request('/api/response/save', {
      method: 'POST',
      body: JSON.stringify(responseData)
    });
  }
  
  /**
   * Get all responses for a session
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Session responses
   */
  async getResponses(sessionId) {
    return this.request(`/api/response/${sessionId}`);
  }
}

export default ApiClient;