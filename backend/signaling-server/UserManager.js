/**
 * Manages user connections and online status
 */
class UserManager {
    constructor() {
      // Modified to store multiple connections per user
      this.users = {};
    }
    
    /**
     * Add a new socket connection for a user
     * @param {string} userId - User ID
     * @param {string} socketId - Socket ID
     * @returns {boolean} - Whether this is the first socket for this user
     */
    addUserSocket(userId, socketId) {
      // Initialize array for this user if it doesn't exist
      if (!this.users[userId]) {
        this.users[userId] = [];
      }
      
      // Add this socket ID to the user's connections if not already present
      if (!this.users[userId].includes(socketId)) {
        this.users[userId].push(socketId);
        return this.users[userId].length === 1; // Return true if this is the first socket
      }
      
      return false;
    }
    
    /**
     * Remove a socket connection for a user
     * @param {string} userId - User ID
     * @param {string} socketId - Socket ID
     * @returns {boolean} - Whether this was the last socket for this user
     */
    removeUserSocket(userId, socketId) {
      if (!this.users[userId]) {
        return false;
      }
      
      const index = this.users[userId].indexOf(socketId);
      if (index !== -1) {
        this.users[userId].splice(index, 1);
      }
      
      // If no more connections for this user, delete the user entry
      if (this.users[userId].length === 0) {
        delete this.users[userId];
        return true; // This was the last socket
      }
      
      return false;
    }
    
    /**
     * Check if a user is online (has at least one active socket)
     * @param {string} userId - User ID
     * @returns {boolean} - Whether user is online
     */
    isUserOnline(userId) {
      return !!this.users[userId] && this.users[userId].length > 0;
    }
    
    /**
     * Get all socket IDs for a user
     * @param {string} userId - User ID
     * @returns {string[]} - Array of socket IDs
     */
    getUserSockets(userId) {
      return this.users[userId] || [];
    }
    
    /**
     * Get all users
     * @returns {Object} - All users
     */
    getAllUsers() {
      return this.users;
    }
  }
  
  module.exports = UserManager;