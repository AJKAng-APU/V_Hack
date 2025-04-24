/**
 * Setup API routes for the server
 * @param {Object} app - Express app instance
 */
function setupApiRoutes(app) {
  // API endpoint to check if a user is online
  app.get('/api/check-online/:userId', (req, res) => {
    const { userId } = req.params;
    const userManager = req.app.locals.userManager;
    
    if (!userManager) {
      return res.status(500).json({ error: 'User manager not available' });
    }
    
    const isOnline = userManager.isUserOnline(userId);
    console.log(`API: Checking if user ${userId} is online: ${isOnline}`);
    res.json({ userId, isOnline });
  });
  
  // Add other API routes here
}

module.exports = { setupApiRoutes };