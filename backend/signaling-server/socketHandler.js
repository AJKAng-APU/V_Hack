/**
 * Create a socket connection handler with improved reliability
 * @param {Object} io - Socket.IO instance
 * @param {Object} userManager - User manager instance
 * @param {Object} callManager - Call manager instance
 * @param {Object} debugUtils - Debug utilities
 * @returns {Function} - Socket handler function
 */
function createSocketHandler(io, userManager, callManager, debugUtils) {
  function isDoctorId(userId) {
    return userId && userId.startsWith('doctor-');
  }
  
  /**
   * Extract the basic user ID from a doctor ID
   * @param {string} doctorId - Doctor ID (e.g., 'doctor-123')
   * @returns {string} - Basic ID (e.g., '123')
   */
  function extractBasicId(doctorId) {
    if (isDoctorId(doctorId)) {
      return doctorId.replace('doctor-', '');
    }
    return doctorId;
  }
  
  return function handleSocket(socket) {
    console.log('New connection:', socket.id);
    
    // Store user IDs for this socket
    socket.userIds = [];
    
    // Register user with their ID
    socket.on('register', (userId) => {
      handleUserRegistration(socket, userId);
    });

    socket.on('direct-call-ended', ({ targetUserId }) => {
      console.log(`Direct call ended signal from socket ${socket.id} to ${targetUserId}`);
      
      // Get the actual userId from the socket
      const userId = socket.userIds[0] || null;
      
      if (!userId) {
        console.log('Cannot identify user sending direct-call-ended');
        return;
      }
      
      // Check if targetUserId is valid
      if (!targetUserId) {
        console.log('Invalid target user ID (null) for direct-call-ended');
        return;
      }
      
      // Get all sockets for the target user
      const targetSockets = userManager.getUserSockets(targetUserId);
      
      if (targetSockets && targetSockets.length > 0) {
        console.log(`Sending direct-call-ended to ${targetSockets.length} sockets of user ${targetUserId}`);
        
        // Send to all sockets of the target user
        targetSockets.forEach(socketId => {
          // Send multiple times with delays for reliability
          io.to(socketId).emit('call-ended');
          
          [200, 600, 1200].forEach(delay => {
            setTimeout(() => {
              io.to(socketId).emit('call-ended');
            }, delay);
          });
        });
      } else {
        console.log(`No active sockets found for target user ${targetUserId}`);
      }
    });
    
    // Handle checking if a user is online
    socket.on('check-user-online', ({ userId, requestId }) => {
      handleCheckUserOnline(socket, userId, requestId);
    });
    
    // Handle call initiation
    socket.on('call-user', ({ targetUserId, offerSDP, callerUserId }) => {
      handleCallUser(socket, targetUserId, offerSDP, callerUserId);
    });
    
    // Handle call acceptance
    socket.on('call-accepted', ({ targetUserId, answerSDP }) => {
      handleCallAccepted(socket, targetUserId, answerSDP);
    });
    
    // Handle call declining
    socket.on('call-declined', ({ targetUserId }) => {
      handleCallDeclined(socket, targetUserId);
    });
    
    // Forward ICE candidates between peers
    socket.on('ice-candidate', ({ targetUserId, candidate }) => {
      handleIceCandidate(socket, targetUserId, candidate);
    });
    
    // Handle call ending
    socket.on('end-call', ({ targetUserId }) => {
      handleEndCall(socket, targetUserId);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      handleDisconnect(socket);
    });
    
    // Periodic check for connection health
    socket.on('heartbeat', () => {
      socket.emit('heartbeat-response');
    });

    socket.on('media-connected', ({ targetUserId }) => {
      // Find the target user's sockets
      const targetSockets = userManager.getUserSockets(targetUserId);
      if (targetSockets && targetSockets.length > 0) {
        // Forward the media connected event to all their devices
        targetSockets.forEach(socketId => {
          io.to(socketId).emit('media-connected');
        });
      }
    });
    
    /**
     * Handle user registration
     */
    function handleUserRegistration(socket, userId) {
      console.log(`User ${userId} registered with socket ${socket.id}`);
      
      const isFirstSocket = userManager.addUserSocket(userId, socket.id);
      
      // Store the userId in the socket for disconnection handling
      if (!socket.userIds.includes(userId)) {
        socket.userIds.push(userId);
      }
      
      // Broadcast to others that this user is online (only if first connection)
      if (isFirstSocket) {
        socket.broadcast.emit('user-online', userId);
      }
      
      // Log all registered users for debugging
      debugUtils.logRegisteredUsers();
    }
    
    /**
     * Handle checking if a user is online
     */
    function handleCheckUserOnline(socket, userId, requestId) {
      const isOnline = userManager.isUserOnline(userId);
      console.log(`Checking if user ${userId} is online: ${isOnline}`);
      
      socket.emit('user-online-status', { 
        userId, 
        isOnline,
        responseId: requestId // Add the requestId to the response
      });
    }
    
    /**
     * Handle call initiation
     */
    function handleCallUser(socket, targetUserId, offerSDP, callerUserId) {
      console.log(`${callerUserId} is calling ${targetUserId}`);
      const targetSocketIds = userManager.getUserSockets(targetUserId);
      
      // Check if target user is online
      if (!targetSocketIds || targetSocketIds.length === 0) {
        console.log(`Call failed: User ${targetUserId} is not online`);
        socket.emit('call-failed', { 
          message: 'User is not online',
          targetUserId 
        });
        return;
      }
      
      // Check if call already exists in either direction
      const existingCall = callManager.findCallBetweenUsers(callerUserId, targetUserId);
      if (existingCall) {
        console.log(`Call already exists, preventing duplicate`);
        socket.emit('call-failed', { 
          message: 'Call already in progress',
          targetUserId 
        });
        return;
      }
      
      // Create new call
      const callId = callManager.createCall(callerUserId, socket.id, targetUserId, targetSocketIds);
      
      console.log(`Call ${callId} registered as active`);
      debugUtils.logActiveCalls();
      
      // Send incoming call to ALL devices of the target user
      targetSocketIds.forEach(socketId => {
        io.to(socketId).emit('incoming-call', {
          callerUserId,
          offerSDP
        });
      });
    }
    
    /**
     * Handle call acceptance
     */
    function handleCallAccepted(socket, targetUserId, answerSDP) {
      console.log(`Call accepted from ${targetUserId}`);
      
      // Get the accepting user's ID
      const userId = socket.userIds[0] || null;
      
      if (!userId) {
        console.log('Cannot identify accepting user ID');
        return;
      }
      
      // Find the call
      const callId = `${targetUserId}-${userId}`;
      const call = callManager.acceptCall(callId, socket.id);
      
      if (!call) {
        console.log(`No active call found with ID ${callId}`);
        return;
      }
      
      console.log(`Call ${callId} was accepted by socket ${socket.id}`);
      debugUtils.logActiveCalls();
      
      // Cancel the call on other devices of this user
      const userSockets = userManager.getUserSockets(userId);
      userSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('call-in-progress', { 
            callerUserId: targetUserId,
            message: 'Call answered on another device'
          });
        }
      });
      
      // Forward answer to caller
      io.to(call.callerSocketId).emit('call-answered', { answerSDP });
    }
    
    /**
     * Handle call declining
     */
    function handleCallDeclined(socket, targetUserId) {
      console.log(`Call from ${targetUserId} was declined`);
      
      // Get the userId from the socket
      const userId = socket.userIds[0] || null;
      
      if (!userId) {
        return;
      }
      
      // Find the call
      const call = callManager.findCallBetweenUsers(userId, targetUserId);
      
      if (call) {
        // Remove the call
        callManager.removeCall(`${call.caller}-${call.target}`);
        
        // Notify caller of declined call
        if (call.callerSocketId) {
          io.to(call.callerSocketId).emit('call-declined');
        } else {
          // Fallback to notifying all of the caller's sockets
          const callerSockets = userManager.getUserSockets(call.caller);
          callerSockets.forEach(socketId => {
            io.to(socketId).emit('call-declined');
          });
        }
        
        debugUtils.logActiveCalls();
      }
    }
    
    /**
     * Handle ICE candidate
     */
    function handleIceCandidate(socket, targetUserId, candidate) {
      // Get the userId from the socket
      const userId = socket.userIds[0] || null;
      
      if (!userId) {
        console.log('Cannot identify user ID for ICE candidate');
        return;
      }
      
      // Find the call
      const call = callManager.findCallBetweenUsers(userId, targetUserId);
      
      if (call) {
        // Determine which socket to send to
        let targetSocketId = null;
        
        if (call.caller === userId && call.targetSocketId) {
          // This is the caller, send to the target socket that accepted
          targetSocketId = call.targetSocketId;
        } else if (call.target === userId && call.callerSocketId) {
          // This is the target, send to the caller socket
          targetSocketId = call.callerSocketId;
        }
        
        if (targetSocketId) {
          io.to(targetSocketId).emit('ice-candidate', { candidate });
        } else {
          // Fallback to all target sockets
          const targetSockets = userManager.getUserSockets(targetUserId);
          if (targetSockets && targetSockets.length > 0) {
            io.to(targetSockets[0]).emit('ice-candidate', { candidate });
          }
        }
      } else {
        console.log(`No active call found for ICE candidate from ${userId} to ${targetUserId}`);
        
        // Fallback to all target sockets
        const targetSockets = userManager.getUserSockets(targetUserId);
        if (targetSockets && targetSockets.length > 0) {
          io.to(targetSockets[0]).emit('ice-candidate', { candidate });
        }
      }
    }
    
    /**
     * Handle ending a call with improved reliability and null checks
     * @param {Object} socket - Socket instance
     * @param {string|null} targetUserId - Target user ID (may be null)
     */
    function handleEndCall(socket, targetUserId) {
      console.log(`Call with ${targetUserId || 'unknown'} ended by socket ${socket.id}`);
      
      // Get the actual userId from the socket
      const userId = socket.userIds[0] || null;
      
      if (!userId) {
        console.log('Cannot identify user ending the call');
        return;
      }
      
      console.log(`User ${userId} is ending call with ${targetUserId || 'unknown'}`);
      
      // Default notification target
      let notifyUserId = targetUserId;
      
      // Find the call - try multiple possible ID combinations
      let call = null;
      
      // Only try to find call if targetUserId is not null
      if (targetUserId) {
        call = callManager.findCallBetweenUsers(userId, targetUserId);
        
        // If no call found, try with doctor prefix variations
        if (!call && userId.startsWith('doctor-')) {
          call = callManager.findCallBetweenUsers(userId.replace('doctor-', ''), targetUserId);
        }
        
        if (!call && targetUserId.startsWith('doctor-')) {
          call = callManager.findCallBetweenUsers(userId, targetUserId.replace('doctor-', ''));
        }
      } else {
        // If targetUserId is null, try to find any active calls for this user
        const userCalls = callManager.findCallsForUser(userId);
        if (userCalls && userCalls.length > 0) {
          call = userCalls[0]; // Take the first active call
          console.log(`Found an active call for user ${userId} without specific target`);
        }
      }
      
      if (call) {
        // Determine which user to notify
        if (call.caller === userId) {
          notifyUserId = call.target;
        } else if (call.target === userId) {
          notifyUserId = call.caller;
        }
        
        // Remove the call from active calls - try both directions
        callManager.removeCall(`${call.caller}-${call.target}`);
        callManager.removeCall(`${call.target}-${call.caller}`);
        
        console.log(`Removed call ${call.caller}-${call.target} from active calls`);
      } else {
        console.log(`No active call found between ${userId} and ${targetUserId || 'unknown'}`);
      }
      
      // Send call-ended to all sockets of the target user with retry mechanism
      if (notifyUserId) {
        const targetSockets = userManager.getUserSockets(notifyUserId);
        
        if (targetSockets && targetSockets.length > 0) {
          console.log(`Sending call-ended to ${targetSockets.length} sockets of user ${notifyUserId}`);
          
          // Helper function to send end notification with reliability
          const sendEndNotification = (socketId, retryCount = 0) => {
            try {
              io.to(socketId).emit('call-ended');
              console.log(`Sent call-ended to socket ${socketId} (attempt ${retryCount + 1})`);
            } catch (err) {
              console.error(`Error sending call-ended to socket ${socketId}:`, err);
            }
          };
          
          // Send to all target sockets with multiple retries
          targetSockets.forEach(socketId => {
            // First attempt
            sendEndNotification(socketId, 0);
            
            // Retry with increasing delays
            [300, 800, 1500].forEach((delay, index) => {
              setTimeout(() => {
                sendEndNotification(socketId, index + 1);
              }, delay);
            });
          });
          
          // Also send direct-call-ended signal as a backup
          targetSockets.forEach(socketId => {
            setTimeout(() => {
              try {
                io.to(socketId).emit('direct-call-ended', { targetUserId: userId });
                console.log(`Sent direct-call-ended to socket ${socketId}`);
              } catch (err) {
                console.error(`Error sending direct-call-ended:`, err);
              }
            }, 500);
          });
        } else {
          console.log(`No active sockets found for target user ${notifyUserId}`);
        }
      } else {
        console.log('No target user ID to notify about call end');
      }
      
      // Log the updated active calls
      debugUtils.logActiveCalls();
    }
    
    /**
     * Handle socket disconnection
     */
    function handleDisconnect(socket) {
      console.log(`Socket ${socket.id} disconnected`);
      
      // Handle disconnect for all user IDs registered by this socket
      if (socket.userIds && socket.userIds.length > 0) {
        socket.userIds.forEach(userId => {
          // Remove this socket from the user's connections
          const isLastSocket = userManager.removeUserSocket(userId, socket.id);
          
          if (isLastSocket) {
            console.log(`User ${userId} has no more active connections`);
            
            // Find all calls for this user
            const userCalls = callManager.findCallsForUser(userId);
            
            // Clean up each call
            userCalls.forEach(call => {
              const callId = `${call.caller}-${call.target}`;
              const otherUserId = call.caller === userId ? call.target : call.caller;
              
              // Notify the other user that the call has ended
              const otherUserSockets = userManager.getUserSockets(otherUserId);
              otherUserSockets.forEach(socketId => {
                io.to(socketId).emit('call-ended');
                
                // Send additional notifications with delay for reliability
                [300, 1000].forEach(delay => {
                  setTimeout(() => {
                    io.to(socketId).emit('call-ended');
                  }, delay);
                });
              });
              
              // Remove the call
              callManager.removeCall(callId);
              console.log(`Call ${callId} removed due to user disconnect`);
            });
            
            // Notify other users that this user is offline
            socket.broadcast.emit('user-offline', userId);
          }
        });
      }
      
      // Log updated state
      debugUtils.logRegisteredUsers();
      debugUtils.logActiveCalls();
    }
  };
}

module.exports = { createSocketHandler };