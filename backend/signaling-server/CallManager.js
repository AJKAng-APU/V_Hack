/**
 * Manages active calls between users
 */
class CallManager {
    constructor() {
      this.activeCalls = {};
    }
    
    /**
     * Register a new call
     * @param {string} callerUserId - Caller user ID
     * @param {string} callerSocketId - Caller socket ID
     * @param {string} targetUserId - Target user ID
     * @param {string[]} targetSockets - Array of target socket IDs
     * @returns {string} - Call ID
     */
    createCall(callerUserId, callerSocketId, targetUserId, targetSockets) {
      const callId = `${callerUserId}-${targetUserId}`;
      
      // Store the active call
      this.activeCalls[callId] = {
        caller: callerUserId,
        callerSocketId: callerSocketId,
        target: targetUserId,
        startTime: Date.now(),
        targetSocketId: null, // Will be set when call is accepted
        allTargetSockets: [...targetSockets], // Store all target sockets for cleanup
        accepted: false
      };
      
      return callId;
    }
    
    /**
     * Update a call when it's accepted
     * @param {string} callId - Call ID
     * @param {string} acceptingSocketId - Socket ID that accepted the call
     * @returns {Object|null} - Updated call or null if not found
     */
    acceptCall(callId, acceptingSocketId) {
      if (!this.activeCalls[callId]) {
        return null;
      }
      
      this.activeCalls[callId].accepted = true;
      this.activeCalls[callId].targetSocketId = acceptingSocketId;
      
      return this.activeCalls[callId];
    }
    
    /**
     * Find a call by user IDs (in either direction)
     * @param {string} userId1 - First user ID
     * @param {string} userId2 - Second user ID
     * @returns {Object|null} - Call object or null if not found
     */
    findCallBetweenUsers(userId1, userId2) {
      const callId1 = `${userId1}-${userId2}`;
      const callId2 = `${userId2}-${userId1}`;
      
      return this.activeCalls[callId1] || this.activeCalls[callId2] || null;
    }
    
    /**
     * Find all calls that a user is participating in
     * @param {string} userId - User ID
     * @returns {Object[]} - Array of call objects
     */
    findCallsForUser(userId) {
      return Object.values(this.activeCalls).filter(
        call => call.caller === userId || call.target === userId
      );
    }
    
    /**
     * Remove a call
     * @param {string} callId - Call ID
     * @returns {boolean} - Whether the call was removed
     */
    removeCall(callId) {
      if (this.activeCalls[callId]) {
        delete this.activeCalls[callId];
        return true;
      }
      return false;
    }
    
    /**
     * Clean up stale calls (calls that have been active for more than an hour)
     * @returns {number} - Number of calls cleaned up
     */
    cleanupStaleCalls() {
      const now = Date.now();
      let cleanupCount = 0;
      
      Object.keys(this.activeCalls).forEach(callId => {
        const call = this.activeCalls[callId];
        // If call has been active for more than an hour, consider it stale
        if (now - call.startTime > 3600000) {
          console.log(`Cleaning up stale call: ${callId}`);
          delete this.activeCalls[callId];
          cleanupCount++;
        }
      });
      
      return cleanupCount;
    }
    
    /**
     * Get all active calls
     * @returns {Object} - All active calls
     */
    getAllCalls() {
      return this.activeCalls;
    }
  }
  
  module.exports = CallManager;