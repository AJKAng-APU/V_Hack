import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertTriangle, 
  Loader, 
  WifiOff, 
  Server, 
  RefreshCw, 
  CheckCircle,
  Clock,
  AlertOctagon
} from 'lucide-react';
import { useTheme } from './ThemeContext';

// Create API middleware context
const ApiMiddlewareContext = createContext();

// Custom hook to use the API middleware context
export const useApiMiddleware = () => {
  return useContext(ApiMiddlewareContext);
};

// Constants for configuration
const CONFIG = {
  RETRY_DELAYS: [2000, 5000, 10000, 30000], // Exponential backoff delays in ms
  CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in ms
  ERROR_DISPLAY_DURATION: 5000, // 5 seconds
  SUCCESS_DISPLAY_DURATION: 3000, // 3 seconds
  QUEUE_PROCESS_INTERVAL: 15000, // Check queued requests every 15 seconds
  MAX_RETRIES: 3, // Maximum number of retries for failed requests
};

// Define the provider component
const ApiMiddlewareProvider = ({ children, colors }) => {
  const { isDarkMode } = useTheme();
  
  // State for tracking API request status
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [apiRetries, setApiRetries] = useState(0);
  const [offline, setOffline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestStats, setRequestStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedResponses: 0,
  });
  
  // Refs for internal tracking
  const activeRequests = useRef(new Map());
  const requestCache = useRef(new Map());
  const queueTimeoutRef = useRef(null);
  const networkStatus = useRef({
    lastOnline: Date.now(),
    lastOffline: null,
    reconnectAttempts: 0,
  });
  
  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      networkStatus.current.lastOnline = Date.now();
      networkStatus.current.reconnectAttempts = 0;
      
      // Process any queued requests when we're back online
      processQueuedRequests();
      
      // Show success message
      setSuccess({
        message: 'You are back online',
        timestamp: Date.now()
      });
      setTimeout(() => setSuccess(null), CONFIG.SUCCESS_DISPLAY_DURATION);
    };
    
    const handleOffline = () => {
      setOffline(true);
      networkStatus.current.lastOffline = Date.now();
    };
    
    // On mount, check if we're offline
    setOffline(!navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Setup interval for checking network status and retrying queued requests
  useEffect(() => {
    const checkNetworkAndQueue = () => {
      // If we have queued requests and we're online, try to process them
      if (pendingRequests.length > 0 && !offline) {
        processQueuedRequests();
      }
      
      // Check if we need to ping the server to verify connection
      if (offline && networkStatus.current.reconnectAttempts < 5) {
        performConnectivityCheck();
      }
    };
    
    const intervalId = setInterval(checkNetworkAndQueue, CONFIG.QUEUE_PROCESS_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [offline, pendingRequests]);
  
  // Reset error after configured time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, CONFIG.ERROR_DISPLAY_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Reset success message after configured time
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, CONFIG.SUCCESS_DISPLAY_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Function to check connectivity by pinging a small endpoint
  const performConnectivityCheck = async () => {
    try {
      // Use a lightweight endpoint for checking connectivity
      // This could be a dedicated health check endpoint in your API
      const response = await fetch('/api/health', { 
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        // Set a short timeout for the connectivity check
        signal: AbortSignal.timeout(5000) 
      });
      
      if (response.ok) {
        setOffline(false);
        networkStatus.current.lastOnline = Date.now();
        networkStatus.current.reconnectAttempts = 0;
        return true;
      }
      return false;
    } catch (error) {
      // Increment reconnect attempts for exponential backoff
      networkStatus.current.reconnectAttempts++;
      return false;
    }
  };
  
  // Process any queued requests when connectivity is restored
  const processQueuedRequests = useCallback(() => {
    if (pendingRequests.length === 0 || offline) return;
    
    // Clone the queue so we can process it without race conditions
    const requestsToProcess = [...pendingRequests];
    setPendingRequests([]); // Clear the queue
    
    // Process each request in order
    requestsToProcess.forEach(async (request) => {
      try {
        // Use callApi without queueing (to avoid infinite loops)
        const result = await executeApiCall(
          request.apiFunction, 
          request.args, 
          { 
            skipQueue: true, 
            customErrorMsg: `Failed to process queued request: ${request.description || ''}` 
          }
        );
        
        // If the request has a callback, execute it with the result
        if (request.onComplete) {
          request.onComplete(result);
        }
        
        // Update stats
        setRequestStats(prev => ({
          ...prev,
          successfulRequests: prev.successfulRequests + 1
        }));
        
      } catch (error) {
        // If the request fails, add it back to the queue if it hasn't exceeded retries
        if (request.retries < CONFIG.MAX_RETRIES) {
          setPendingRequests(prev => [...prev, {
            ...request,
            retries: request.retries + 1,
            lastAttempt: Date.now()
          }]);
        } else {
          // If we've exceeded retries, log it and update stats
          console.error('Request exceeded max retries and was dropped:', request);
          setRequestStats(prev => ({
            ...prev,
            failedRequests: prev.failedRequests + 1
          }));
          
          // If the request has an onError callback, execute it
          if (request.onError) {
            request.onError(error);
          }
        }
      }
    });
  }, [pendingRequests, offline]);
  
  // Clear expired items from the cache
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of requestCache.current.entries()) {
      if (now - value.timestamp > CONFIG.CACHE_EXPIRY) {
        requestCache.current.delete(key);
      }
    }
  }, []);
  
  // Generate a cache key from function and args
  const generateCacheKey = (apiFunction, args) => {
    // Use the function name and stringified args as cache key
    const funcName = apiFunction.name || 'anonymousFunction';
    return `${funcName}-${JSON.stringify(args)}`;
  };
  
  // Core function to execute an API call with all middleware features
  const executeApiCall = async (apiFunction, args = [], options = {}) => {
    const {
      skipCache = false,
      skipQueue = false,
      skipRetry = false,
      skipLoading = false,
      customErrorMsg = null,
      cacheKey = null,
      showSuccessMessage = false,
      successMessage = 'Operation completed successfully'
    } = options;
    
    // Update the request statistics
    setRequestStats(prev => ({
      ...prev,
      totalRequests: prev.totalRequests + 1
    }));
    
    try {
      // If not specifically skipped, set loading state
      if (!skipLoading) {
        setIsLoading(true);
      }
      
      // Generate a unique ID for this request to track it
      const requestId = Math.random().toString(36).substring(2, 9);
      
      // Check if we're offline and should queue this request
      if (offline && !skipQueue) {
        setPendingRequests(prev => [...prev, {
          id: requestId,
          apiFunction,
          args,
          retries: 0,
          createdAt: Date.now(),
          lastAttempt: null,
          description: typeof args[0] === 'string' ? args[0] : 'API request',
          options
        }]);
        
        throw new Error("You're currently offline. Request has been queued for when you're back online.");
      }
      
      // If caching is not skipped, check the cache first
      const actualCacheKey = cacheKey || generateCacheKey(apiFunction, args);
      if (!skipCache) {
        const cachedResponse = requestCache.current.get(actualCacheKey);
        
        // If found in cache and not expired
        if (cachedResponse && (Date.now() - cachedResponse.timestamp < CONFIG.CACHE_EXPIRY)) {
          // Update stats for cached responses
          setRequestStats(prev => ({
            ...prev,
            cachedResponses: prev.cachedResponses + 1
          }));
          
          return cachedResponse.data;
        }
        
        // Clean up expired cache items periodically
        cleanupCache();
      }
      
      // Track the request in our active requests map
      activeRequests.current.set(requestId, {
        startTime: Date.now(),
        function: apiFunction.name || 'anonymous',
        args
      });
      
      // Execute the API call
      const result = await apiFunction(...args);
      
      // Remove from active requests
      activeRequests.current.delete(requestId);
      
      // Cache the successful result
      if (!skipCache) {
        requestCache.current.set(actualCacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      
      // Update successful request count
      setRequestStats(prev => ({
        ...prev,
        successfulRequests: prev.successfulRequests + 1
      }));
      
      // Show success message if configured
      if (showSuccessMessage) {
        setSuccess({
          message: successMessage,
          timestamp: Date.now()
        });
        setTimeout(() => setSuccess(null), CONFIG.SUCCESS_DISPLAY_DURATION);
      }
      
      return result;
    } catch (err) {
      // Format the error message to be more user-friendly
      let errorMessage = err.message || 'An unknown error occurred';
      
      // Use custom error message if provided
      if (customErrorMsg) {
        errorMessage = customErrorMsg;
      }
      // Add more context to common errors
      else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error: Please check your connection and try again.';
        setOffline(true);
        
        // Increment retry counter
        setApiRetries(prev => prev + 1);
      } else if (errorMessage.includes('Timeout')) {
        errorMessage = 'Request timed out: The server took too long to respond.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Authentication error: Please log in again.';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = 'Access denied: You don\'t have permission to access this resource.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Server error: Our system is experiencing issues. Please try again later.';
      } else if (errorMessage.includes('offline') || errorMessage.includes('queued')) {
        // Don't show error message for queued requests
        setError(null);
        throw err;
      }
      
      setError({
        message: errorMessage,
        timestamp: Date.now(),
        code: err.code || 'UNKNOWN',
        retryable: !skipRetry
      });
      
      // Update failed request count
      setRequestStats(prev => ({
        ...prev,
        failedRequests: prev.failedRequests + 1
      }));
      
      throw err;
    } finally {
      if (!skipLoading) {
        setIsLoading(false);
      }
    }
  };
  
  // Wrapper for API calls to handle loading and errors with appropriate options
  const callApi = async (apiFunction, ...args) => {
    return executeApiCall(apiFunction, args);
  };
  
  // Enhanced callApi with additional options
  const callApiWithOptions = async (apiFunction, args = [], options = {}) => {
    return executeApiCall(apiFunction, args, options);
  };
  
  // Clear error state
  const clearError = () => {
    setError(null);
  };
  
  // Retry the last failed request (placeholder for future enhancement)
  const retryLastRequest = () => {
    setError(null);
    
    // If we have pending requests and we're back online, try processing them
    if (pendingRequests.length > 0 && !offline) {
      processQueuedRequests();
    }
  };
  
  // Force an immediate network connectivity check
  const checkConnection = async () => {
    const isConnected = await performConnectivityCheck();
    if (isConnected && pendingRequests.length > 0) {
      processQueuedRequests();
    }
    return isConnected;
  };
  
  // Get API performance metrics
  const getMetrics = () => {
    const activeRequestCount = activeRequests.current.size;
    const activeRequestsArray = Array.from(activeRequests.current.values());
    
    return {
      ...requestStats,
      activeRequests: activeRequestCount,
      queuedRequests: pendingRequests.length,
      cacheSize: requestCache.current.size,
      averageResponseTime: calculateAverageResponseTime(),
      longestRunningRequest: activeRequestCount > 0 
        ? activeRequestsArray.reduce((prev, current) => 
            current.startTime < prev.startTime ? current : prev
          )
        : null
    };
  };
  
  // Calculate average response time (placeholder implementation)
  const calculateAverageResponseTime = () => {
    // In a real implementation, you would track response times for completed requests
    // and calculate an average. This is a placeholder.
    return 200; // ms
  };
  
  // Reset connection state and retry counters
  const resetConnectionState = () => {
    setOffline(false);
    setApiRetries(0);
    networkStatus.current.reconnectAttempts = 0;
    checkConnection();
  };
  
  // Clear the request cache
  const clearCache = () => {
    requestCache.current.clear();
    setRequestStats(prev => ({
      ...prev,
      cachedResponses: 0
    }));
  };
  
  // Value to be provided to consuming components
  const value = {
    isLoading,
    loadingMessage,
    setLoadingMessage,
    error,
    offline,
    apiRetries,
    pendingRequests,
    clearError,
    callApi,
    callApiWithOptions,
    retryLastRequest,
    checkConnection,
    getMetrics,
    resetConnectionState,
    clearCache,
    requestStats
  };
  
  return (
    <ApiMiddlewareContext.Provider value={value}>
      {/* Loading overlay with customizable message */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="p-6 rounded-2xl shadow-lg animate-pulse dark-mode-transition"
               style={{ 
                 backgroundColor: isDarkMode ? colors.cardBg : 'white',
                 boxShadow: `0 20px 25px -5px ${colors.primary}30`
               }}>
            <div className="flex items-center">
              <Loader size={24} className="animate-spin mr-3" style={{ color: colors.primary }} />
              <span className="text-lg font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                {loadingMessage}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Offline indicator with enhanced UI */}
      {offline && !error && (
        <div className="fixed top-5 right-0 left-0 mx-auto w-max z-50">
          <div className="p-4 rounded-xl shadow-lg flex items-center max-w-md animate-bounce-in dark-mode-transition"
               style={{ 
                 backgroundColor: isDarkMode ? colors.cardBg : 'white',
                 borderLeft: `4px solid ${colors.warning}`,
                 boxShadow: `0 10px 15px -3px ${colors.warning}30`
               }}>
            <WifiOff size={20} className="mr-3" style={{ color: colors.warning }} />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                You're Offline
              </h4>
              <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                Using cached data. <span className="font-medium text-xs">{pendingRequests.length}</span> requests queued for when you're back online.
              </p>
            </div>
            <button 
              className="ml-4 p-2 rounded-full transition-colors duration-300 dark-mode-transition"
              style={{ 
                backgroundColor: isDarkMode ? `${colors.warning}20` : `${colors.warning}10`,
                color: colors.warning
              }}
              onClick={checkConnection}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Error toast with more detailed information */}
      {error && (
        <div className="fixed bottom-5 left-0 right-0 mx-auto w-max z-50">
          <div className="p-4 rounded-xl shadow-lg flex items-center max-w-md animate-bounce-in dark-mode-transition"
               style={{ 
                 backgroundColor: isDarkMode ? colors.cardBg : 'white',
                 borderLeft: `4px solid ${colors.danger}`,
                 boxShadow: `0 10px 15px -3px ${colors.danger}30`
               }}>
            <AlertTriangle size={20} className="mr-3" style={{ color: colors.danger }} />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Error
              </h4>
              <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                {error.message}
              </p>
              {error.retryable && !offline && (
                <button 
                  className="mt-2 text-xs py-1 px-2 rounded transition-colors duration-300"
                  style={{ 
                    backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10`,
                    color: colors.primary
                  }}
                  onClick={retryLastRequest}
                >
                  Retry
                </button>
              )}
            </div>
            <button 
              className="ml-4 p-2 rounded-full transition-colors duration-300 dark-mode-transition"
              style={{ 
                backgroundColor: isDarkMode ? `${colors.danger}20` : `${colors.danger}10`,
                color: colors.danger
              }}
              onClick={clearError}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Success toast notification */}
      {success && (
        <div className="fixed top-20 left-0 right-0 mx-auto w-max z-50">
          <div className="p-4 rounded-xl shadow-lg flex items-center max-w-md animate-bounce-in dark-mode-transition"
               style={{ 
                 backgroundColor: isDarkMode ? colors.cardBg : 'white',
                 borderLeft: `4px solid ${colors.success}`,
                 boxShadow: `0 10px 15px -3px ${colors.success}30`
               }}>
            <CheckCircle size={20} className="mr-3" style={{ color: colors.success }} />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Success
              </h4>
              <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                {success.message}
              </p>
            </div>
            <button 
              className="ml-4 p-2 rounded-full transition-colors duration-300 dark-mode-transition"
              style={{ 
                backgroundColor: isDarkMode ? `${colors.success}20` : `${colors.success}10`,
                color: colors.success
              }}
              onClick={() => setSuccess(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Server error (after multiple retries) with more detailed info */}
      {apiRetries > 2 && !error && (
        <div className="fixed bottom-5 left-0 right-0 mx-auto w-max z-50">
          <div className="p-4 rounded-xl shadow-lg flex items-start max-w-md animate-bounce-in dark-mode-transition"
               style={{ 
                 backgroundColor: isDarkMode ? colors.cardBg : 'white',
                 borderLeft: `4px solid ${colors.info}`,
                 boxShadow: `0 10px 15px -3px ${colors.info}30`
               }}>
            <Server size={20} className="mr-3 mt-1" style={{ color: colors.info }} />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Server Connection Issues
              </h4>
              <p className="text-xs mb-2 dark-mode-transition" style={{ color: colors.textSecondary }}>
                Using local data mode: Some features may be limited
              </p>
              <div className="flex space-x-2">
                <button 
                  className="text-xs py-1 px-2 rounded transition-colors duration-300"
                  style={{ 
                    backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10`,
                    color: colors.primary
                  }}
                  onClick={checkConnection}
                >
                  <RefreshCw size={12} className="inline mr-1" />
                  Check Connection
                </button>
                
                <button 
                  className="text-xs py-1 px-2 rounded transition-colors duration-300"
                  style={{ 
                    backgroundColor: isDarkMode ? `${colors.warning}20` : `${colors.warning}10`,
                    color: colors.warning
                  }}
                  onClick={() => {
                    setApiRetries(0);
                    clearCache();
                  }}
                >
                  Reset & Clear Cache
                </button>
              </div>
            </div>
            <button 
              className="ml-2 p-2 rounded-full transition-colors duration-300 dark-mode-transition"
              style={{ 
                backgroundColor: isDarkMode ? `${colors.info}20` : `${colors.info}10`,
                color: colors.info
              }}
              onClick={() => setApiRetries(0)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Critical error warning for important failures */}
      {apiRetries > 4 && (
        <div className="fixed top-20 left-0 right-0 mx-auto w-max z-50">
          <div className="p-4 rounded-xl shadow-lg flex items-center max-w-md animate-bounce-in dark-mode-transition"
               style={{ 
                 backgroundColor: isDarkMode ? colors.cardBg : 'white',
                 borderLeft: `4px solid ${colors.danger}`,
                 boxShadow: `0 10px 15px -3px ${colors.danger}30`
               }}>
            <AlertOctagon size={20} className="mr-3" style={{ color: colors.danger }} />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Connection Problem
              </h4>
              <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                Cannot connect to the server. Some features may not work correctly.
              </p>
            </div>
            <button 
              className="ml-4 p-2 rounded-full transition-colors duration-300 dark-mode-transition"
              style={{ 
                backgroundColor: isDarkMode ? `${colors.danger}20` : `${colors.danger}10`,
                color: colors.danger
              }}
              onClick={() => resetConnectionState()}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Connection status indicator when offline with pending requests */}
      {offline && pendingRequests.length > 0 && (
        <div className="fixed bottom-20 right-5 z-50">
          <div className="p-3 rounded-full shadow-lg flex items-center animate-pulse dark-mode-transition"
               style={{ 
                 backgroundColor: isDarkMode ? colors.cardBg : 'white',
                 boxShadow: `0 10px 15px -3px ${colors.warning}30`
               }}>
            <div className="relative">
              <WifiOff size={20} style={{ color: colors.warning }} />
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                   style={{ backgroundColor: colors.warning }}>
                {pendingRequests.length}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Slow request indicator for long-running requests */}
      {Array.from(activeRequests.current.values()).some(req => Date.now() - req.startTime > 8000) && (
        <div className="fixed bottom-20 left-5 z-50">
          <div className="p-3 rounded-full shadow-lg flex items-center animate-pulse dark-mode-transition"
               style={{ 
                 backgroundColor: isDarkMode ? colors.cardBg : 'white',
                 boxShadow: `0 10px 15px -3px ${colors.info}30`
               }}>
            <Clock size={20} style={{ color: colors.info }} />
          </div>
        </div>
      )}
      
      {children}
      
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out forwards;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </ApiMiddlewareContext.Provider>
  );
};

// Export as a named export
export { ApiMiddlewareProvider };

// Export as default
export default ApiMiddlewareProvider;