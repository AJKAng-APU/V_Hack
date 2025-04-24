import React, { useState, useEffect, useRef } from 'react';
import { Activity, CheckCircle, RefreshCw, AlertCircle, Lock, ArrowUpRight } from 'lucide-react';
import { useHealthData } from './HealthDataContext';
import { useTheme } from './ThemeContext';

const GoogleFitIntegration = ({ colors }) => {
  const { isDarkMode } = useTheme();
  const { 
    isGoogleFitConnected, 
    connectGoogleFit, 
    fetchHealthData, 
    loading,
    error
  } = useHealthData();
  
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [connectingTooLong, setConnectingTooLong] = useState(false);
  const connectingTimerRef = useRef(null);
  
  // Initialize last refresh time
  useEffect(() => {
    if (isGoogleFitConnected && !lastRefresh) {
      setLastRefresh(new Date());
    }
  }, [isGoogleFitConnected, lastRefresh]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (connectingTimerRef.current) {
        clearTimeout(connectingTimerRef.current);
      }
    };
  }, []);
  
  // Connect to Google Fit
  const handleConnect = async () => {
    try {
      setConnectingTooLong(false);
      
      // Set a timeout to show a message if connecting takes too long
      connectingTimerRef.current = setTimeout(() => {
        if (!isGoogleFitConnected) {
          setConnectingTooLong(true);
        }
      }, 5000);
      
      await connectGoogleFit();
      
      // Clear the timeout if connection succeeds
      if (connectingTimerRef.current) {
        clearTimeout(connectingTimerRef.current);
        connectingTimerRef.current = null;
      }
      
      setConnectionSuccess(true);
      setTimeout(() => setConnectionSuccess(false), 3000);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to connect to Google Fit:', error);
      // Clear the timeout if connection fails
      if (connectingTimerRef.current) {
        clearTimeout(connectingTimerRef.current);
        connectingTimerRef.current = null;
      }
    }
  };
  
  // Refresh health data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchHealthData();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh health data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Format time since last refresh
  const formatTimeSince = (date) => {
    if (!date) return 'Not yet';
    
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 120) return '1 minute ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 7200) return '1 hour ago';
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    
    return date.toLocaleTimeString();
  };
  
  // Style variables for dark mode
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  
  return (
    <div className="rounded-2xl shadow-lg border overflow-hidden transform transition-all duration-500 dark-mode-transition"
         style={{ 
           backgroundColor: cardBg,
           borderColor: borderColor,
           boxShadow: `0 10px 15px -3px ${colors.primary}30`
         }}>
      <div className="p-5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full" 
             style={{ 
               background: `radial-gradient(circle, ${colors.gradientAlt1}20, transparent 70%)`,
               transform: 'translate(30%, -30%)'
             }}></div>
             
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" 
               style={{ 
                 background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`
               }}>
            <Activity size={24} color="white" />
          </div>
          <div>
            <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>
              Google Fit Integration
            </h3>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              {isGoogleFitConnected 
                ? 'Your health data is synced with Google Fit' 
                : 'Connect to import your health metrics automatically'}
            </p>
          </div>
        </div>
        
        {/* Connection Success Message */}
        {connectionSuccess && (
          <div className="mb-4 p-3 rounded-lg flex items-center dark-mode-transition" 
               style={{ 
                 backgroundColor: `${colors.success}15`,
                 color: colors.success
               }}>
            <CheckCircle size={18} className="mr-2" />
            <span className="text-sm">Successfully connected to Google Fit!</span>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-center dark-mode-transition" 
               style={{ 
                 backgroundColor: `${colors.danger}15`,
                 color: colors.danger
               }}>
            <AlertCircle size={18} className="mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {/* Connecting taking too long message */}
        {connectingTooLong && loading && (
          <div className="mb-4 p-3 rounded-lg flex items-center dark-mode-transition" 
               style={{ 
                 backgroundColor: `${colors.warning}15`,
                 color: colors.warning
               }}>
            <AlertCircle size={18} className="mr-2" />
            <span className="text-sm">Connection is taking longer than expected. This may be due to network issues.</span>
          </div>
        )}
        
        {/* Data Security Message */}
        {!isGoogleFitConnected && (
          <div className="mb-4 p-3 rounded-lg flex items-start dark-mode-transition" 
               style={{ 
                 backgroundColor: isDarkMode ? `${colors.primary}15` : '#F0F9FF',
                 color: colors.primary
               }}>
            <Lock size={18} className="mr-2 mt-0.5" />
            <div>
              <span className="text-sm font-medium">Your privacy is important to us</span>
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                We only access the health data you authorize. All your information is encrypted and securely stored.
              </p>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          {!isGoogleFitConnected ? (
            <button 
              onClick={handleConnect}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center"
              style={{ 
                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                boxShadow: `0 4px 6px -1px ${colors.primary}40`,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Activity size={18} className="mr-2" />
                  Connect Google Fit
                </>
              )}
            </button>
          ) : (
            <>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center dark-mode-transition"
                style={{ 
                  backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10`,
                  color: colors.primary,
                  boxShadow: `0 4px 6px -1px ${colors.primary}20`,
                  opacity: refreshing ? 0.7 : 1
                }}
              >
                <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <div className="flex items-center px-4 py-3 rounded-xl dark-mode-transition" 
                   style={{ 
                     backgroundColor: isDarkMode ? `${colors.success}20` : `${colors.success}10`,
                     color: colors.success
                   }}>
                <CheckCircle size={18} className="mr-2" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {isGoogleFitConnected && (
        <div className="px-5 py-3 border-t flex justify-between items-center dark-mode-transition"
             style={{ 
               borderColor: borderColor,
               backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB'
             }}>
          <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
            Last updated: 
            <span className="ml-1 font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
              {formatTimeSince(lastRefresh)}
            </span>
          </p>
          <a 
            href="#settings"
            className="text-xs font-medium flex items-center transition-colors duration-300"
            style={{ color: colors.primary }}
          >
            Manage Settings
            <ArrowUpRight size={12} className="ml-1" />
          </a>
        </div>
      )}
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default GoogleFitIntegration;