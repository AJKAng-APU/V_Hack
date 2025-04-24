// File: server/signaling.js
const socketIo = require('socket.io');
const CallManager = require('./CallManager');
const UserManager = require('./UserManager');
const { createSocketHandler } = require('./socketHandler');
const { logRegisteredUsers, logActiveCalls } = require('./debugUtils');

/**
 * Setup the WebRTC signaling server
 * @param {Object} server - HTTP server instance
 */
function setupSignalingServer(server) {
  // Initialize Socket.io with CORS settings
  const io = socketIo(server, {
    cors: {
      origin: "*", // Allow connections from any origin (restrict in production)
      methods: ["GET", "POST"]
    }
  });
  
  // Create user and call managers
  const userManager = new UserManager();
  const callManager = new CallManager();
  
  // Store the userManager in app.locals to make it available to API routes
  server.app && (server.app.locals.userManager = userManager);
  
  // Setup debug utils
  const debugUtils = {
    logRegisteredUsers: () => logRegisteredUsers(userManager.getAllUsers()),
    logActiveCalls: () => logActiveCalls(callManager.getAllCalls())
  };

  // Create socket handler with dependencies
  const handleSocket = createSocketHandler(io, userManager, callManager, debugUtils);
  
  // Socket.io connection handling
  io.on('connection', handleSocket);
  
  // Periodic cleanup for stale calls
  setInterval(() => {
    const cleanedCount = callManager.cleanupStaleCalls();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} stale call(s)`);
      debugUtils.logActiveCalls();
    }
  }, 60000); // Run cleanup every minute
  
  return io;
}

module.exports = { setupSignalingServer };