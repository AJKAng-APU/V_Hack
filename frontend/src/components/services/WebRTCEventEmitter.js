/**
 * Simple event emitter for WebRTC events
 */
class WebRTCEventEmitter {
    constructor() {
      this.eventListeners = {};
    }
    
    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    emit(event, data) {
      if (this.eventListeners[event]) {
        this.eventListeners[event].forEach(callback => callback(data));
      }
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Event callback
     * @returns {function} - Unsubscribe function
     */
    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
      
      // Return a function to remove the listener
      return () => {
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      };
    }
  }
  
  export default WebRTCEventEmitter;