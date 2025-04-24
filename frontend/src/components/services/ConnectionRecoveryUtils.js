// File: services/WebRTC/ConnectionRecoveryUtils.js

/**
 * Utilities for WebRTC connection recovery and socket reconnection
 * Add this file to your project and import where needed
 */

// Reliable socket reconnection with backoff
export async function reconnectSocket(signalingService, userId) {
    if (!signalingService) return false;
    
    console.log('Starting socket reconnection attempt with backoff');
    
    // Try different transport strategies in sequence
    const strategies = [
      { transport: ['websocket', 'polling'], delay: 1000, attempts: 2 },
      { transport: ['polling', 'websocket'], delay: 2000, attempts: 2 },
      { transport: ['polling'], delay: 3000, attempts: 1 }
    ];
    
    for (const strategy of strategies) {
      // Try each strategy for the specified number of attempts
      for (let i = 0; i < strategy.attempts; i++) {
        console.log(`Trying reconnection with transports: ${strategy.transport.join(', ')} (attempt ${i+1}/${strategy.attempts})`);
        
        try {
          // Configure transports
          if (signalingService.socket && signalingService.socket.io) {
            signalingService.socket.io.opts.transports = strategy.transport;
          }
          
          // Try to reconnect
          const success = await attemptReconnect(signalingService, userId, strategy.delay);
          if (success) {
            console.log('Reconnection successful!');
            return true;
          }
        } catch (err) {
          console.error('Error during reconnection attempt:', err);
        }
        
        // Wait before trying next attempt
        await new Promise(resolve => setTimeout(resolve, strategy.delay));
      }
    }
    
    console.log('All reconnection strategies failed');
    return false;
  }
  
  // Helper function for attempting a single reconnection
  async function attemptReconnect(signalingService, userId, timeout) {
    return new Promise((resolve) => {
      // Already connected
      if (signalingService.isConnected()) {
        resolve(true);
        return;
      }
      
      console.log(`Attempting reconnection with ${timeout}ms timeout`);
      
      // Setup handlers for connection events
      const connectHandler = () => {
        if (signalingService.socket) {
          signalingService.socket.off('connect', connectHandler);
        }
        clearTimeout(timeoutId);
        
        // Re-register after successful connection
        if (userId) {
          signalingService.send('register', userId);
          console.log(`Re-registered as ${userId} after reconnection`);
        }
        
        resolve(true);
      };
      
      if (signalingService.socket) {
        signalingService.socket.once('connect', connectHandler);
        
        // Clean up old connection before trying to connect
        try {
          if (signalingService.socket.connected) {
            signalingService.socket.disconnect();
          }
        } catch (e) {
          console.warn('Error cleaning up socket before reconnection:', e);
        }
        
        // Try to connect
        try {
          signalingService.socket.connect();
        } catch (e) {
          console.error('Error attempting to connect socket:', e);
        }
      } else if (typeof signalingService.reconnect === 'function') {
        // Use the reconnect method if available
        signalingService.reconnect()
          .then(success => {
            if (success) {
              connectHandler();
            } else {
              resolve(false);
            }
          })
          .catch(() => resolve(false));
      }
      
      // Set timeout for the attempt
      const timeoutId = setTimeout(() => {
        if (signalingService.socket) {
          signalingService.socket.off('connect', connectHandler);
        }
        console.log('Reconnection attempt timed out');
        resolve(false);
      }, timeout);
    });
  }
  
  // Diagnostic function to check socket health
  export function checkSocketHealth(signalingService) {
    if (!signalingService) return { healthy: false, reason: 'No signaling service' };
    
    // Basic connectivity check
    const isConnected = signalingService.isConnected();
    if (!isConnected) {
      return { healthy: false, reason: 'Socket disconnected' };
    }
    
    // Get more detailed status if available
    const status = signalingService.getStatus ? signalingService.getStatus() : { connected: isConnected };
    
    // Check if there are pending messages
    if (status.pendingMessages && status.pendingMessages > 10) {
      return { 
        healthy: false, 
        reason: `Too many pending messages (${status.pendingMessages})`,
        status
      };
    }
    
    // Check if the socket is in a reconnecting state
    if (status.reconnecting) {
      return { 
        healthy: false, 
        reason: 'Socket is trying to reconnect',
        status
      };
    }
    
    // Return healthy status with details
    return { 
      healthy: true, 
      status
    };
  }
  
  // Create a global socket health check that runs periodically
  export function setupGlobalSocketHealthCheck(signalingService, userId, checkIntervalMs = 10000) {
    if (!signalingService) return null;
    
    console.log(`Setting up global socket health check every ${checkIntervalMs}ms`);
    
    let consecutiveFailures = 0;
    const MAX_FAILURES = 3;
    
    const intervalId = setInterval(async () => {
      const health = checkSocketHealth(signalingService);
      
      if (!health.healthy) {
        consecutiveFailures++;
        console.warn(`Socket health check failed (${consecutiveFailures}/${MAX_FAILURES}): ${health.reason}`);
        
        if (consecutiveFailures >= MAX_FAILURES) {
          console.error(`${MAX_FAILURES} consecutive socket health checks failed, attempting recovery`);
          
          // Try to reconnect
          const success = await reconnectSocket(signalingService, userId);
          
          if (success) {
            consecutiveFailures = 0;
            console.log('Socket recovery successful');
            
            // Dispatch recovery event
            try {
              window.dispatchEvent(new CustomEvent('socket-recovered'));
            } catch (e) {
              // Ignore dispatch errors
            }
          } else {
            console.error('Socket recovery failed');
            
            // Dispatch failure event
            try {
              window.dispatchEvent(new CustomEvent('socket-recovery-failed'));
            } catch (e) {
              // Ignore dispatch errors
            }
          }
        }
      } else {
        // Reset counter on successful health check
        if (consecutiveFailures > 0) {
          console.log('Socket health restored');
          consecutiveFailures = 0;
        }
      }
    }, checkIntervalMs);
    
    // Return a function to stop the health check
    return () => {
      clearInterval(intervalId);
      console.log('Global socket health check stopped');
    };
  }
  
  // Function to help recover from call failure
  export async function recoverFromCallFailure(webRTCService, targetUserId) {
    console.log('Attempting to recover from call failure');
    
    // 1. End any existing call
    webRTCService.endCall(true);
    
    // 2. Make sure socket is connected
    const socketRecovered = await reconnectSocket(
      webRTCService.signalingService, 
      webRTCService.userId
    );
    
    if (!socketRecovered) {
      console.error('Failed to recover socket connection');
      return false;
    }
    
    // 3. Verify target user is still online
    let isTargetOnline = false;
    try {
      isTargetOnline = await webRTCService.checkUserOnline(targetUserId);
    } catch (e) {
      console.error('Error checking if target user is online:', e);
    }
    
    if (!isTargetOnline) {
      console.log('Target user is not online, cannot recover call');
      return false;
    }
    
    // 4. Reset media resources
    try {
      await webRTCService.getLocalMedia(true, true);
    } catch (e) {
      console.error('Failed to reset media resources:', e);
      return false;
    }
    
    console.log('Call recovery preparation complete, ready to try again');
    return true;
  }