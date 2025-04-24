/**
 * Logger for WebRTC operations
 */
class WebRTCLogger {
    constructor() {
      this.enabled = true;
      this.logHistory = [];
      this.maxLogHistory = 100;
    }
    
    /**
     * Log a message with timestamp
     * @param {string} message - Log message
     * @param {any} data - Additional data
     */
    log(message, data = null) {
      if (!this.enabled) return;
      
      const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
      const prefix = `[WebRTC ${timestamp}]`;
      
      if (data) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
      
      // Store logs in history
      this.logHistory.push({
        timestamp: new Date().toISOString(),
        message,
        data: data ? JSON.stringify(data) : null
      });
      
      // Keep only the most recent logs
      if (this.logHistory.length > this.maxLogHistory) {
        this.logHistory.shift();
      }
      
      // Store in localStorage for debugging
      try {
        localStorage.setItem('webrtc_logs', JSON.stringify(this.logHistory));
      } catch (error) {
        // localStorage might be disabled or full
      }
    }
    
    /**
     * Log an error
     * @param {string} message - Error message
     * @param {string} details - Error details
     */
    error(message, details = null) {
      const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
      const prefix = `[WebRTC ERROR ${timestamp}]`;
      
      if (details) {
        console.error(prefix, message, details);
      } else {
        console.error(prefix, message);
      }
      
      // Store in log history
      this.logHistory.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        details
      });
      
      // Keep only the most recent logs
      if (this.logHistory.length > this.maxLogHistory) {
        this.logHistory.shift();
      }
      
      // Store in localStorage for debugging
      try {
        localStorage.setItem('webrtc_logs', JSON.stringify(this.logHistory));
      } catch (error) {
        // localStorage might be disabled or full
      }
    }
    
    /**
     * Enable or disable logging
     * @param {boolean} enabled - Whether logging is enabled
     */
    setEnabled(enabled) {
      this.enabled = enabled;
    }
    
    /**
     * Get the log history
     * @returns {Array} - Log history
     */
    getLogHistory() {
      return this.logHistory;
    }
    
    /**
     * Clear the log history
     */
    clearLogHistory() {
      this.logHistory = [];
      try {
        localStorage.removeItem('webrtc_logs');
      } catch (error) {
        // localStorage might be disabled
      }
    }
  }
  
  export default WebRTCLogger;