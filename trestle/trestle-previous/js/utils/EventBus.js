/**
 * EventBus - Simple pub/sub implementation for component communication
 */
export class EventBus {
    constructor() {
        this.subscribers = new Map();
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        
        const callbacks = this.subscribers.get(event);
        callbacks.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        };
    }
    
    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    publish(event, data = {}) {
        if (!this.subscribers.has(event)) {
            return;
        }
        
        const callbacks = this.subscribers.get(event);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }
    
    /**
     * Remove all subscribers for an event
     * @param {string} event - Event name
     */
    unsubscribeAll(event) {
        if (event) {
            this.subscribers.delete(event);
        } else {
            this.subscribers.clear();
        }
    }
}
