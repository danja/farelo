/**
 * EventBus for application-wide event communication
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  
  /**
   * Register a listener for an event
   * @param {String} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  /**
   * Remove a listener for an event
   * @param {String} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const eventListeners = this.listeners.get(event);
      eventListeners.delete(callback);
      
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
  
  /**
   * Emit an event with data
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data = {}) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }
  
  /**
   * Register a one-time listener for an event
   * @param {String} event - Event name
   * @param {Function} callback - Event callback
   */
  once(event, callback) {
    const onceCallback = (data) => {
      this.off(event, onceCallback);
      callback(data);
    };
    
    this.on(event, onceCallback);
  }
  
  /**
   * Clear all listeners for an event
   * @param {String} event - Event name
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  
  /**
   * Check if event has listeners
   * @param {String} event - Event name
   * @returns {Boolean} Whether event has listeners
   */
  hasListeners(event) {
    return this.listeners.has(event) && this.listeners.get(event).size > 0;
  }
}

export default EventBus;