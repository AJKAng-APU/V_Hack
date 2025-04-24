const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const CallManager = require('./CallManager');
const UserManager = require('./UserManager');
const { createSocketHandler } = require('./socketHandler');
const { logRegisteredUsers, logActiveCalls } = require('./debugUtils');
const { setupApiRoutes } = require('./api');

// Create Express app and HTTP server
const app = express();
app.use(cors());
const server = http.createServer(app);

// Simple endpoint to check if server is running
app.get('/', (req, res) => {
  res.send('Signaling server is running');
});

// Setup API routes
setupApiRoutes(app);

// Setup Socket.IO signaling
setupSignalingServer(server);

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

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