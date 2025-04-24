import React, { useState, useEffect } from 'react';
import { 
  Clock, Moon, Sun, Activity, Heart, 
  Droplet, Calendar, RefreshCw, AlertCircle, 
  ArrowLeft, Zap, Info, User
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useHealthData } from '../HealthDataContext';
import { useApiMiddleware } from '../ApiMiddleware';

const BiorhythmScreen = ({ colors = {}, setActiveScreen }) => {
  // Context hooks
  const { isDarkMode } = useTheme();
  const { 
    healthMetrics, 
    isGoogleFitConnected,
    biorhythmAdvice,
    getBiorhythmAdvice,
    connectGoogleFit,
    fetchHealthData,
    loading: healthDataLoading
  } = useHealthData();
  const { callApiWithOptions } = useApiMiddleware();
  
  // Local state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chronotype, setChronotype] = useState("intermediate");
  
  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, []);
  
  // Load all required data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If not connected to Google Fit, don't try to fetch data
      if (!isGoogleFitConnected) {
        setLoading(false);
        return;
      }
      
      // Fetch health data from Google Fit
      await callApiWithOptions(
        fetchHealthData,
        [{ days: 7 }],
        {
          skipCache: true,
          customErrorMsg: "Could not fetch your health data"
        }
      );
      
      // Get medication time based on current time
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const medicationTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Fetch biorhythm advice
      await callApiWithOptions(
        getBiorhythmAdvice,
        [chronotype, medicationTime],
        {
          skipCache: true,
          customErrorMsg: "Could not fetch biorhythm advice"
        }
      );
      
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load your health data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle connect to Google Fit
  const handleConnectGoogleFit = async () => {
    try {
      await connectGoogleFit();
      if (isGoogleFitConnected) {
        loadData();
      }
    } catch (error) {
      console.error("Failed to connect to Google Fit:", error);
      setError("Failed to connect to Google Fit. Please try again.");
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // Format values helper
  const formatValue = (value, unit = "", decimals = 1) => {
    if (value === undefined || value === null) return "N/A";
    return `${parseFloat(value).toFixed(decimals)} ${unit}`;
  };
  
  // Dark mode styles
  const pageBgColor = isDarkMode ? colors.background : 'rgba(219, 234, 254, 0.3)';
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  
  return (
    <div className="p-4 pb-20 overflow-y-auto dark-mode-transition" style={{ backgroundColor: pageBgColor }}>
      {/* Header with back button */}
      <header className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <button 
            className="mr-2 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 dark-mode-transition"
            onClick={() => setActiveScreen('dashboard')}
            style={{ backgroundColor: isDarkMode ? `${colors.primary}15` : 'rgba(219, 234, 254, 0.6)' }}
          >
            <ArrowLeft size={18} style={{ color: colors.textPrimary }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">Biorhythms</h1>
            <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>Your health & natural cycles</p>
          </div>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 dark-mode-transition"
          style={{ 
            backgroundColor: isDarkMode ? `${colors.primary}15` : 'rgba(219, 234, 254, 0.6)',
            color: colors.primary
          }}
        >
          <RefreshCw size={18} className={refreshing || loading ? "animate-spin" : ""} />
        </button>
      </header>
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg flex items-start dark-mode-transition" 
             style={{ 
               backgroundColor: `${colors.warning}15`, 
               borderLeft: `4px solid ${colors.warning}`
             }}>
          <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" style={{ color: colors.warning }} />
          <div>
            <p className="text-sm font-medium dark-mode-transition" style={{ color: colors.warning }}>Notice</p>
            <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{error}</p>
          </div>
        </div>
      )}
      
      {/* Google Fit Connection Status */}
      {!isGoogleFitConnected ? (
        <div className="mb-6 p-4 rounded-xl shadow-lg border dark-mode-transition" 
             style={{ 
               backgroundColor: cardBg, 
               borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
               boxShadow: `0 10px 15px -5px ${colors.primary}30` 
             }}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" 
                 style={{ 
                   background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                 }}>
              <Activity size={24} color="white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Connect Google Fit
              </h3>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                To see your health data
              </p>
            </div>
          </div>
          <p className="text-sm mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>
            Connect your Google Fit account to display your health metrics and enhance your biorhythm analysis.
          </p>
          <button
            onClick={handleConnectGoogleFit}
            disabled={loading || healthDataLoading}
            className="w-full py-3 px-4 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg flex items-center justify-center"
            style={{ 
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              boxShadow: `0 8px 12px -3px ${colors.primary}40`,
              opacity: (loading || healthDataLoading) ? 0.7 : 1
            }}
          >
            {(loading || healthDataLoading) ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Activity size={18} className="mr-2" />
                <span>Connect Google Fit</span>
              </>
            )}
          </button>
        </div>
      ) : loading || refreshing ? (
        // Loading state
        <div className="mb-6 space-y-4">
          <div className="h-28 rounded-xl animate-pulse dark-mode-transition" 
               style={{ backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}20` }}></div>
          <div className="h-40 rounded-xl animate-pulse dark-mode-transition" 
               style={{ backgroundColor: isDarkMode ? `${colors.primary}15` : `${colors.primary}15` }}></div>
        </div>
      ) : (
        // Connected and data loaded
        <>
          {/* Google Fit Health Data Display */}
          <div className="mb-6 p-4 rounded-xl shadow-lg border dark-mode-transition" 
               style={{ 
                 backgroundColor: cardBg, 
                 borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                 boxShadow: `0 10px 15px -5px ${colors.primary}30` 
               }}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center shimmer" 
                   style={{ 
                     background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                   }}>
                <Activity size={20} color="white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                  Your Google Fit Data
                </h3>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-1 animate-pulse" 
                       style={{ backgroundColor: colors.success }}></div>
                  <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Connected
                  </p>
                </div>
              </div>
            </div>
            
            {/* Health Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Weight */}
              <div className="p-3 rounded-xl border dark-mode-transition" 
                   style={{ 
                     backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                     borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)'
                   }}>
                <div className="flex items-center mb-1">
                  <User size={14} className="mr-1" style={{ color: colors.primary }} />
                  <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Weight
                  </span>
                </div>
                <span className="text-base font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                  {healthMetrics?.weight ? formatValue(healthMetrics.weight, "kg") : "No data"}
                </span>
              </div>
              
              {/* Height */}
              <div className="p-3 rounded-xl border dark-mode-transition" 
                   style={{ 
                     backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                     borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)'
                   }}>
                <div className="flex items-center mb-1">
                  <User size={14} className="mr-1" style={{ color: colors.primary }} />
                  <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Height
                  </span>
                </div>
                <span className="text-base font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                  {healthMetrics?.height ? formatValue(healthMetrics.height, "m") : "No data"}
                </span>
              </div>
              
              {/* BMI */}
              <div className="p-3 rounded-xl border dark-mode-transition" 
                   style={{ 
                     backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                     borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)'
                   }}>
                <div className="flex items-center mb-1">
                  <Info size={14} className="mr-1" style={{ color: colors.primary }} />
                  <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>
                    BMI
                  </span>
                </div>
                <span className="text-base font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                  {healthMetrics?.BMI ? formatValue(healthMetrics.BMI, "") : "No data"}
                </span>
              </div>
              
              {/* Blood Pressure */}
              <div className="p-3 rounded-xl border dark-mode-transition" 
                   style={{ 
                     backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                     borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)'
                   }}>
                <div className="flex items-center mb-1">
                  <Heart size={14} className="mr-1" style={{ color: colors.primary }} />
                  <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Blood Pressure
                  </span>
                </div>
                <span className="text-base font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                  {healthMetrics?.pressure?.systolic ? 
                    `${Math.round(healthMetrics.pressure.systolic)}/${Math.round(healthMetrics.pressure.diastolic)} mmHg` : 
                    "No data"}
                </span>
              </div>
              
              {/* Glucose */}
              <div className="p-3 rounded-xl border dark-mode-transition" 
                   style={{ 
                     backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                     borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)'
                   }}>
                <div className="flex items-center mb-1">
                  <Droplet size={14} className="mr-1" style={{ color: colors.primary }} />
                  <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Glucose
                  </span>
                </div>
                <span className="text-base font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                  {healthMetrics?.glucose ? formatValue(healthMetrics.glucose, "mg/dL") : "No data"}
                </span>
              </div>
              
              {/* Sleep Time */}
              <div className="p-3 rounded-xl border dark-mode-transition" 
                   style={{ 
                     backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                     borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)'
                   }}>
                <div className="flex items-center mb-1">
                  <Moon size={14} className="mr-1" style={{ color: colors.primary }} />
                  <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Sleep Time
                  </span>
                </div>
                <span className="text-base font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                  {healthMetrics?.sleep && healthMetrics.sleep.sleep_time ? 
                    `${healthMetrics.sleep.sleep_time} - ${healthMetrics.sleep.wake_time}` : 
                    "No data"}
                </span>
              </div>
            </div>
            
            {/* Last updated info */}
            <div className="flex items-center justify-between pt-2 border-t dark-mode-transition" 
                 style={{ borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)' }}>
              <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                Last updated: {new Date().toLocaleTimeString()}
              </p>
              <button 
                onClick={handleRefresh} 
                className="text-xs font-medium flex items-center"
                style={{ color: colors.primary }}
              >
                <RefreshCw size={12} className="mr-1" />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Biorhythm Data from API */}
          <div className="mb-6 p-4 rounded-xl shadow-lg border dark-mode-transition" 
               style={{ 
                 backgroundColor: cardBg, 
                 borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                 boxShadow: `0 10px 15px -5px ${colors.primary}30` 
               }}>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center shimmer" 
                   style={{ 
                     background: `linear-gradient(135deg, ${colors.accentAlt}, ${colors.gradientAlt2})`
                   }}>
                <Zap size={20} color="white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                  Biorhythm Analysis
                </h3>
                <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                  Based on your health data
                </p>
              </div>
            </div>
            
            {biorhythmAdvice ? (
              <div className="space-y-4">
                {/* Medication Timing */}
                <div className="p-3 rounded-xl border dark-mode-transition" 
                     style={{ 
                       backgroundColor: isDarkMode ? `${colors.accent}15` : 'rgba(239, 246, 255, 0.6)',
                       borderColor: isDarkMode ? `${colors.accent}30` : 'rgba(219, 234, 254, 1)'
                     }}>
                  <h4 className="text-sm font-medium mb-1 dark-mode-transition" style={{ color: colors.accent }}>
                    Recommended Medication Time
                  </h4>
                  <p className="text-base font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                    {biorhythmAdvice.medicationTime || "No recommendation available"}
                  </p>
                </div>
                
                {/* Sleep Advice */}
                <div className="p-3 rounded-xl border dark-mode-transition" 
                     style={{ 
                       backgroundColor: isDarkMode ? `${colors.primary}15` : 'rgba(239, 246, 255, 0.6)',
                       borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)'
                     }}>
                  <h4 className="text-sm font-medium mb-1 dark-mode-transition" style={{ color: colors.primary }}>
                    Sleep Recommendation
                  </h4>
                  <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                    {biorhythmAdvice.sleepAdvice || "No sleep advice available"}
                  </p>
                </div>
                
                {/* General Advice */}
                <div className="p-3 rounded-xl border dark-mode-transition" 
                     style={{ 
                       backgroundColor: isDarkMode ? `${colors.gradientAlt1}15` : 'rgba(239, 246, 255, 0.6)',
                       borderColor: isDarkMode ? `${colors.gradientAlt1}30` : 'rgba(219, 234, 254, 1)'
                     }}>
                  <h4 className="text-sm font-medium mb-1 dark-mode-transition" style={{ color: colors.gradientAlt1 }}>
                    Biorhythm Insight
                  </h4>
                  <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                    {biorhythmAdvice.generalAdvice || "No general advice available"}
                  </p>
                </div>
                
                {/* Chronotype Info */}
                <div className="p-3 rounded-xl border dark-mode-transition" 
                     style={{ 
                       backgroundColor: isDarkMode ? `${colors.success}15` : 'rgba(239, 246, 255, 0.6)',
                       borderColor: isDarkMode ? `${colors.success}30` : 'rgba(219, 234, 254, 1)'
                     }}>
                  <h4 className="text-sm font-medium mb-1 dark-mode-transition" style={{ color: colors.success }}>
                    Your Chronotype
                  </h4>
                  <div className="flex justify-between items-center">
                    <p className="text-base font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                      {biorhythmAdvice.chronotype || "Intermediate"}
                    </p>
                    <select 
                      value={chronotype}
                      onChange={(e) => setChronotype(e.target.value)}
                      className="text-xs py-1 px-2 rounded dark-mode-transition"
                      style={{
                        backgroundColor: isDarkMode ? colors.darkBg : 'white',
                        color: colors.textPrimary,
                        borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)'
                      }}
                    >
                      <option value="very_early_morning">Very Early Bird</option>
                      <option value="early_morning">Early Bird</option>
                      <option value="morning">Morning Person</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="evening">Evening Person</option>
                      <option value="late_evening">Night Owl</option>
                      <option value="very_late_evening">Extreme Night Owl</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg text-center dark-mode-transition" 
                   style={{ backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)' }}>
                <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                  No biorhythm data available. Try refreshing.
                </p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Footer note */}
      <div className="mb-6 p-3 rounded-xl text-center relative overflow-hidden dark-mode-transition"
           style={{ 
             backgroundColor: isDarkMode ? `${colors.primary}20` : 'rgba(219, 234, 254, 1)'
           }}>
        <div className="absolute -top-8 -right-8 w-16 h-16 rounded-full opacity-20"
             style={{ background: `radial-gradient(circle, ${colors.accent}, transparent 70%)` }}></div>
        <div className="absolute -bottom-8 -left-8 w-16 h-16 rounded-full opacity-20"
             style={{ background: `radial-gradient(circle, ${colors.primary}, transparent 70%)` }}></div>
             
        <p className="text-xs relative dark-mode-transition" style={{ color: colors.textSecondary }}>
          Biorhythm data is powered by our AI backend and your Google Fit health metrics.
        </p>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        .shimmer {
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.2) 50%, 
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .dark .shimmer {
          background: linear-gradient(90deg, 
            rgba(30,41,59,0) 0%, 
            rgba(30,41,59,0.3) 50%, 
            rgba(30,41,59,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default BiorhythmScreen;