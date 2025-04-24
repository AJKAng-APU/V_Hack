// File: services/WebRTC/SignalingService.js
import io from 'socket.io-client';

/**
 * Creates a signaling service instance with enhanced reliability and transport fallback
 * @param {string} serverUrl - Signaling server URL
 * @param {string} userId - Current user ID
 * @param {function} eventHandler - Event handler function
 * @returns {Object} - Signaling service instance
 */
export function createSignalingService(serverUrl, userId, eventHandler) {
  console.log(`Creating signaling service for ${userId} to ${serverUrl}`);
  
  // CRITICAL CHANGE: Enhanced Socket.io configuration with transport fallback
  const socket = io(serverUrl, {
    reconnection: true,
    reconnectionAttempts: Infinity,  // Never stop trying to reconnect
    reconnectionDelay: 1000,         // Initial delay
    reconnectionDelayMax: 5000,      // Maximum delay
    randomizationFactor: 0.5,        // Randomization factor for reconnection attempts
    timeout: 20000,                  // Longer timeout
    transports: ['websocket', 'polling'],  // Try both transport methods
    upgrade: true,                   // Attempt to upgrade to WebSocket if possible
    rememberUpgrade: true,           // Remember if websocket was successful
    autoConnect: true,               // Connect on creation
    forceNew: false                  // Reuse connection if possible
  });
  
  let connected = false;
  let reconnecting = false;
  let pendingMessages = [];
  let reconnectAttempts = 0;
  let forceClosing = false; // Flag to track intentional disconnects
  
  // Create a better logging system for the signaling service
  const log = (message, level = 'info') => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
    const prefix = `[Signaling ${timestamp}]`;
    
    if (level === 'error') {
      console.error(prefix, message);
    } else if (level === 'warn') {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
    
    // Store logs in localStorage for debugging (limited to last 100 entries)
    try {
      const logs = JSON.parse(localStorage.getItem('signaling_logs') || '[]');
      logs.push({ timestamp: new Date().toISOString(), level, message });
      
      // Keep only the last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('signaling_logs', JSON.stringify(logs));
    } catch (e) {
      // Ignore storage errors
    }
  };
  
  // Handle connection events with better logging
  socket.on('connect', () => {
    log(`Connected to signaling server (Socket ID: ${socket.id})`);
    connected = true;
    reconnecting = false;
    reconnectAttempts = 0;
    
    // Register user ID with the signaling server
    socket.emit('register', userId);
    log(`Registered as user: ${userId}`);
    
    // Process any pending messages
    if (pendingMessages.length > 0) {
      log(`Processing ${pendingMessages.length} pending messages`);
      
      // Create a copy of the pending messages to avoid modification during iteration
      const messagesToSend = [...pendingMessages];
      pendingMessages = [];
      
      // Send messages with a small delay between them
      messagesToSend.forEach((msg, index) => {
        setTimeout(() => {
          try {
            socket.emit(msg.event, msg.data);
            log(`Sent pending message: ${msg.event}`);
          } catch (err) {
            log(`Error sending pending message: ${err.message}`, 'error');
            pendingMessages.push(msg); // Re-queue if sending fails
          }
        }, index * 100); // 100ms between messages to avoid flooding
      });
    }
    
    // Dispatch a connection event that components can listen for
    try {
      window.dispatchEvent(new CustomEvent('signaling-connected'));
    } catch (e) {
      // Ignore event dispatch errors
    }
  });
  
  socket.on('connect_error', (error) => {
    log(`Connection error: ${error.message}`, 'error');
    
    // Check if we should switch to polling if websocket fails
    if (socket.io.opts.transports[0] === 'websocket' && reconnectAttempts >= 2) {
      log('WebSocket connection failed, forcing polling transport', 'warn');
      // Force the socket to use polling temporarily
      socket.io.opts.transports = ['polling', 'websocket'];
    }
  });
  
  socket.on('disconnect', (reason) => {
    log(`Disconnected from signaling server, reason: ${reason}`, 'warn');
    connected = false;
    
    // Only set reconnecting flag if this wasn't an intentional disconnect
    if (!forceClosing) {
      reconnecting = true;
      
      // If the disconnection was not intended, attempt to reconnect immediately
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
        log('Unexpected disconnection, attempting immediate reconnection');
        setTimeout(() => {
          if (!connected && !forceClosing) {
            log('Forcing reconnection after unexpected disconnect');
            socket.connect();
          }
        }, 1000);
      }
    }
    
    // Dispatch a disconnection event that components can listen for
    try {
      window.dispatchEvent(new CustomEvent('signaling-disconnected', { detail: { reason } }));
    } catch (e) {
      // Ignore event dispatch errors
    }
  });
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    reconnectAttempts = attemptNumber;
    log(`Attempting to reconnect (attempt ${attemptNumber})`);
    reconnecting = true;
    
    // After several failed websocket attempts, try polling
    if (attemptNumber > 3 && socket.io.opts.transports[0] === 'websocket') {
      log('Multiple websocket reconnect attempts failed, trying polling', 'warn');
      socket.io.opts.transports = ['polling', 'websocket'];
    }
    
    // After even more failures, try a completely new connection
    if (attemptNumber > 5) {
      log('Multiple reconnect attempts failed, trying new connection', 'warn');
      socket.io.opts.forceNew = true;
    }
  });
  
  socket.on('reconnect', (attemptNumber) => {
    log(`Reconnected after ${attemptNumber} attempts`);
    reconnecting = false;
    connected = true;
    
    // Re-register after reconnection
    socket.emit('register', userId);
    log(`Re-registered as user: ${userId}`);
    
    // Reset transports after successful reconnection
    socket.io.opts.transports = ['websocket', 'polling'];
    socket.io.opts.forceNew = false;
    
    // Dispatch a reconnection event that components can listen for
    try {
      window.dispatchEvent(new CustomEvent('signaling-reconnected'));
    } catch (e) {
      // Ignore event dispatch errors
    }
  });
  
  socket.on('reconnect_error', (error) => {
    log(`Reconnection error: ${error.message}`, 'error');
    
    // After multiple reconnection errors, try a more aggressive approach
    if (reconnectAttempts > 3) {
      log('Multiple reconnection errors, trying alternative connection method', 'warn');
      
      // Try a completely new connection with forced polling
      setTimeout(() => {
        if (!connected && !forceClosing) {
          socket.io.opts.transports = ['polling'];
          socket.io.opts.forceNew = true;
          socket.connect();
        }
      }, 2000);
    }
  });
  
  socket.on('reconnect_failed', () => {
    log('Failed to reconnect after all attempts', 'error');
    reconnecting = false;
    
    // One last desperate attempt after complete failure
    setTimeout(() => {
      if (!connected && !forceClosing) {
        log('Making last-ditch reconnection attempt', 'warn');
        socket.io.opts = {
          ...socket.io.opts,
          transports: ['polling'],
          forceNew: true,
          timeout: 30000
        };
        socket.connect();
      }
    }, 5000);
  });
  
  socket.on('error', (error) => {
    log(`Socket error: ${error.message || error}`, 'error');
  });
  
  // Set up event listeners for signaling messages
  socket.on('incoming-call', (data) => {
    eventHandler('incoming-call', data);
  });
  
  socket.on('call-answered', (data) => {
    eventHandler('call-answered', data);
  });
  
  socket.on('call-declined', () => {
    eventHandler('call-declined');
  });
  
  socket.on('call-in-progress', (data) => {
    eventHandler('call-in-progress', data);
  });
  
  socket.on('ice-candidate', (data) => {
    eventHandler('ice-candidate', data);
  });
  
  socket.on('call-ended', () => {
    eventHandler('call-ended');
  });
  
  socket.on('direct-call-ended', (data) => {
    eventHandler('direct-call-ended', data);
  });
  
  socket.on('call-failed', (data) => {
    eventHandler('call-failed', data);
  });
  
  socket.on('media-connected', () => {
    eventHandler('media-connected');
  });
  
  // Return the signaling service interface with enhanced functionality
  return {
    socket, // Expose the socket object for direct access if needed
    
    /**
     * Send a message to the signaling server with improved error handling and queuing
     * @param {string} event - Event name
     * @param {Object} data - Event data
     * @returns {boolean} - Whether the message was sent or queued successfully
     */
    send: (event, data) => {
      // Special handling for critical messages like call-ended
      const isCriticalMessage = event === 'end-call' || event === 'direct-call-ended' || 
                               event === 'call-declined' || event === 'register';
      
      if (connected) {
        try {
          socket.emit(event, data);
          log(`Sent ${event} message`);
          
          // For critical messages, add redundancy
          if (isCriticalMessage) {
            // Send again after a short delay for reliability
            setTimeout(() => {
              if (connected) {
                socket.emit(event, data);
                log(`Sent redundant ${event} message`);
              } else {
                pendingMessages.unshift({ event, data }); // Add to front of queue
              }
            }, 500);
          }
          
          return true;
        } catch (error) {
          log(`Error sending ${event}: ${error.message}`, 'error');
          
          // Queue the message in case of error
          pendingMessages.push({ event, data });
          
          // Try to reconnect immediately
          if (!reconnecting) {
            socket.connect();
          }
          
          return false;
        }
      } else if (reconnecting || !connected) {
        // Queue the message to be sent after reconnection
        log(`Queueing ${event} message to be sent after reconnection`);
        
        // Critical messages go to the front of the queue
        if (isCriticalMessage) {
          pendingMessages.unshift({ event, data });
        } else {
          pendingMessages.push({ event, data });
        }
        
        // Try to reconnect immediately if not already reconnecting
        if (!reconnecting) {
          log('Triggering reconnection for queued message');
          socket.connect();
        }
        
        return false;
      }
    },
    
    /**
     * Check if a user is online with improved reliability
     * @param {string} userId - User ID to check
     * @returns {Promise<boolean>} - Whether the user is online
     */
    checkUserOnline: (userId) => {
      return new Promise((resolve) => {
        if (!connected) {
          // Try to reconnect first
          log(`Not connected when checking if ${userId} is online, attempting to reconnect`);
          
          socket.connect();
          
          // Wait a bit for potential connection
          setTimeout(() => {
            if (connected) {
              // Now try the check
              checkOnlineStatus(userId, resolve);
            } else {
              log(`Failed to reconnect when checking if ${userId} is online`, 'warn');
              resolve(false);
            }
          }, 2000);
        } else {
          checkOnlineStatus(userId, resolve);
        }
      });
      
      function checkOnlineStatus(userId, resolve) {
        // Create a unique request ID
        const requestId = `online-check-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        log(`Checking if user ${userId} is online (requestId: ${requestId})`);
        socket.emit('check-user-online', { userId, requestId });
        
        // Set up a one-time event listener for the response
        const responseHandler = (data) => {
          if (data.responseId === requestId && data.userId === userId) {
            socket.off('user-online-status', responseHandler);
            clearTimeout(timeoutId);
            log(`User ${userId} online status: ${data.isOnline}`);
            resolve(data.isOnline);
          }
        };
        
        socket.on('user-online-status', responseHandler);
        
        // Set a timeout in case we never get a response
        const timeoutId = setTimeout(() => {
          socket.off('user-online-status', responseHandler);
          log(`User online check timed out for ${userId}`, 'warn');
          resolve(false);
        }, 5000);
      }
    },
    
    /**
     * Check if connected to the signaling server
     * @returns {boolean} - Whether connected
     */
    isConnected: () => connected,
    
    /**
     * Force reconnection to the signaling server
     * @returns {Promise<boolean>} - Whether reconnection was successful
     */
    reconnect: () => {
      return new Promise((resolve) => {
        if (connected) {
          resolve(true);
          return;
        }
        
        log('Forcing reconnection to signaling server');
        
        // Reset socket.io options to try all transport methods
        socket.io.opts.transports = ['websocket', 'polling'];
        
        const connectHandler = () => {
          socket.off('connect', connectHandler);
          clearTimeout(timeoutId);
          
          // Re-register after connection
          socket.emit('register', userId);
          log(`Re-registered as ${userId} after forced reconnection`);
          resolve(true);
        };
        
        socket.once('connect', connectHandler);
        socket.connect();
        
        const timeoutId = setTimeout(() => {
          socket.off('connect', connectHandler);
          log('Forced reconnection attempt timed out', 'error');
          
          // Try one more time with polling transport
          socket.io.opts.transports = ['polling'];
          socket.connect();
          
          // Set another timeout for the second attempt
          setTimeout(() => {
            if (connected) {
              resolve(true);
            } else {
              log('Second reconnection attempt failed', 'error');
              resolve(false);
            }
          }, 5000);
        }, 5000);
      });
    },
    
    /**
     * Get connection status and detailed diagnostic information
     * @returns {Object} - Connection status object
     */
    getStatus: () => {
      return {
        connected,
        reconnecting,
        pendingMessages: pendingMessages.length,
        socketId: socket.id,
        reconnectAttempts,
        currentTransports: socket.io.opts.transports,
        url: serverUrl,
        userId
      };
    },
    
    /**
     * Flush any pending messages immediately
     * @returns {number} - Number of messages flushed
     */
    flushPendingMessages: () => {
      if (!connected || pendingMessages.length === 0) {
        return 0;
      }
      
      const count = pendingMessages.length;
      log(`Flushing ${count} pending messages`);
      
      // Create a copy of the messages to avoid modification during sending
      const messagesToSend = [...pendingMessages];
      pendingMessages = [];
      
      // Send messages with a small delay between them
      messagesToSend.forEach((msg, index) => {
        setTimeout(() => {
          try {
            socket.emit(msg.event, msg.data);
            log(`Flushed pending message: ${msg.event}`);
          } catch (err) {
            log(`Error during flush: ${err.message}`, 'error');
            pendingMessages.push(msg); // Re-queue if sending fails
          }
        }, index * 100); // 100ms between messages
      });
      
      return count;
    },
    
    /**
     * Force a new socket connection
     * @returns {Promise<boolean>} - Whether the new connection was successful
     */
    forceNewConnection: () => {
      return new Promise((resolve) => {
        log('Forcing completely new socket connection');
        
        // Disconnect current socket if connected
        if (connected) {
          forceClosing = true;
          socket.disconnect();
        }
        
        // Reset connection options
        socket.io.opts = {
          ...socket.io.opts,
          forceNew: true,
          transports: ['websocket', 'polling']
        };
        
        // Reset flags
        forceClosing = false;
        reconnecting = false;
        
        // Register connect handler
        const connectHandler = () => {
          socket.off('connect', connectHandler);
          clearTimeout(timeoutId);
          
          // Re-register after connection
          socket.emit('register', userId);
          log(`Re-registered as ${userId} after new connection`);
          resolve(true);
        };
        
        socket.once('connect', connectHandler);
        
        // Attempt connection
        socket.connect();
        
        // Set timeout for connection attempt
        const timeoutId = setTimeout(() => {
          socket.off('connect', connectHandler);
          log('New connection attempt timed out', 'error');
          resolve(false);
        }, 7000);
      });
    },
    
    /**
     * Get the logs for debugging
     * @returns {Array} - Array of log entries
     */
    getLogs: () => {
      try {
        return JSON.parse(localStorage.getItem('signaling_logs') || '[]');
      } catch (e) {
        return [];
      }
    },
    
    /**
     * Disconnect from the signaling server
     */
    disconnect: () => {
      if (connected) {
        log('Explicitly disconnecting from signaling server');
        forceClosing = true;
        socket.disconnect();
        connected = false;
      }
    }
  };
}