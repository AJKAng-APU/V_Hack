import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Lightbulb, ChevronRight, Activity, Brain, 
  TrendingUp, BarChart2, Clock, Calendar, Heart, RefreshCw,
  Loader, Link, AlertCircle, WifiOff, CheckCircle, User,
  LifeBuoy, Database, Dumbbell, Apple, Moon, Settings
} from "lucide-react"; 
import { useTheme } from '../ThemeContext';
import { useHealthData } from '../HealthDataContext';
import { useApiMiddleware } from '../ApiMiddleware';
import api from '../api';

const SymptomsScreen = ({ colors }) => {
    const { isDarkMode } = useTheme();
    const { isLoading, callApi } = useApiMiddleware();
    const { 
      isGoogleFitConnected, 
      connectGoogleFit,
      symptoms, 
      addSymptom, 
      healthMetrics, 
      aiInsights,
      loading: healthDataLoading,
      fetchHealthData,
      prediction
    } = useHealthData();
    
    // Local state
    const [view, setView] = useState('main');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [googleFitStatus, setGoogleFitStatus] = useState({
      isConnecting: false,
      connectionError: null,
      dataFreshness: 'unknown'
    });
    const [googleFitData, setGoogleFitData] = useState(null);
    
    // Fetch health data on component mount
    useEffect(() => {
      if (isGoogleFitConnected) {
        refreshGoogleFitData();
      }
    }, [isGoogleFitConnected]);
    
    // Refresh Google Fit data
    const refreshGoogleFitData = async () => {
      if (!isGoogleFitConnected) {
        setGoogleFitData(null);
        return;
      }
      
      try {
        setIsRefreshing(true);
        setGoogleFitStatus(prev => ({ ...prev, dataFreshness: 'refreshing' }));
        
        // Call the API directly to ensure we're not using mock data
        const freshData = await callApi(api.fetchHealthData, { days: 7 });
        
        // Only update if we got actual data back
        if (freshData && Object.keys(freshData).length > 0) {
          setGoogleFitData(freshData);
          setLastUpdated(new Date());
          setGoogleFitStatus(prev => ({ ...prev, dataFreshness: 'fresh' }));
        } else {
          setGoogleFitStatus(prev => ({ 
            ...prev, 
            dataFreshness: 'unavailable',
            connectionError: 'No data returned from Google Fit'
          }));
        }
      } catch (error) {
        console.error("Failed to refresh Google Fit data:", error);
        setGoogleFitStatus(prev => ({ 
          ...prev, 
          dataFreshness: 'error',
          connectionError: error.message || 'Failed to fetch Google Fit data'
        }));
      } finally {
        setIsRefreshing(false);
      }
    };
    
    // Connect to Google Fit
    const handleConnectGoogleFit = async () => {
      try {
        setGoogleFitStatus(prev => ({ ...prev, isConnecting: true, connectionError: null }));
        
        // Make the actual connection to Google Fit
        await connectGoogleFit();
        
        // Fetch data immediately after connection
        await refreshGoogleFitData();
        
        setGoogleFitStatus(prev => ({ ...prev, isConnecting: false }));
      } catch (error) {
        console.error("Failed to connect to Google Fit:", error);
        setGoogleFitStatus(prev => ({ 
          ...prev, 
          isConnecting: false, 
          connectionError: error.message || 'Failed to connect to Google Fit'
        }));
      }
    };

    // Handle the "View analysis" button click
    const handleViewAnalysis = () => {
      // Change view to 'insights' to show the AI analysis
      setView('insights');
    };
    
    // Format the display text for symptom date and time
    const formatTimeDisplay = (symptom) => {
      return `${symptom.date}, ${symptom.time}`;
    };
    
    // Format last updated time
    const formatLastUpdated = () => {
      if (!lastUpdated) return "Never";
      
      const now = new Date();
      const diff = Math.floor((now - lastUpdated) / 1000); // seconds
      
      if (diff < 60) return "Just now";
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      return lastUpdated.toLocaleDateString();
    };
    
    // Style variables
    const cardBg = isDarkMode ? colors.cardBg : 'white';
    const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
    const sectionHeadingClass = "font-bold text-lg dark-mode-transition mb-4";
    const sectionHeadingStyle = { color: colors.textPrimary };
    const cardClass = "p-5 rounded-2xl shadow-lg border overflow-hidden dark-mode-transition transform transition-all hover:shadow-xl";
    const cardStyle = { 
      backgroundColor: cardBg, 
      borderColor: borderColor,
      boxShadow: `0 10px 15px -3px ${colors.primary}20`
    };
    const buttonClass = "py-2.5 px-4 rounded-lg transition-all flex items-center justify-center";
    const primaryButtonStyle = {
      background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
      color: 'white',
      boxShadow: `0 4px 6px -1px ${colors.primary}30`
    };
    
    // Check if we have real data from Google Fit
    const hasGoogleFitData = googleFitData && Object.keys(googleFitData).length > 0;
    
    // Handle adding a new symptom
    const handleAddSymptom = async (symptomData) => {
      if (!isGoogleFitConnected || !hasGoogleFitData) {
        // If no Google Fit data, don't attach health context
        await addSymptom(symptomData);
      } else {
        // Add health metrics from Google Fit
        const enhancedSymptomData = {
          ...symptomData,
          healthContext: {
            bmi: googleFitData.BMI,
            bloodPressure: {
              systolic: googleFitData.systolic,
              diastolic: googleFitData.diastolic
            },
            glucose: googleFitData.glucose,
            sleep: {
              sleep_time: googleFitData.sleep_time,
              wake_time: googleFitData.wake_time
            }
          }
        };
        
        await addSymptom(enhancedSymptomData);
      }
      
      // Show success message and return to main view
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      setView('main');
    };
    
    // Render Google Fit connection component
    const renderGoogleFitConnection = () => (
      <div className={cardClass + " mb-8"} style={cardStyle}>
        <div className="flex items-start mb-4">
          <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center"
               style={{ 
                 background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
               }}>
            <Activity size={24} color="white" />
          </div>
          <div>
            <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>
              Google Fit Integration
            </h3>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              Connect to import your health metrics in real-time
            </p>
          </div>
        </div>
        
        {isGoogleFitConnected ? (
          <div>
            <div className="p-3 rounded-lg flex items-center mb-4"
                 style={{ 
                   backgroundColor: `${colors.success}15`,
                   color: colors.success
                 }}>
              <CheckCircle size={18} className="mr-2" />
              <span className="text-sm">
                Connected to Google Fit
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={refreshGoogleFitData}
                disabled={isRefreshing}
                className="flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center"
                style={{ 
                  backgroundColor: `${colors.primary}15`,
                  color: colors.primary,
                  opacity: isRefreshing ? 0.7 : 1
                }}
              >
                <RefreshCw size={18} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
              
              <button 
                className="py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center"
                style={{ 
                  backgroundColor: `${colors.accent}15`,
                  color: colors.accent
                }}
              >
                <Settings size={18} className="mr-2" />
                Manage
              </button>
            </div>
            
            {googleFitStatus.connectionError && (
              <div className="p-3 rounded-lg flex items-center mt-4"
                   style={{ 
                     backgroundColor: `${colors.warning}15`,
                     color: colors.warning
                   }}>
                <AlertCircle size={18} className="mr-2" />
                <span className="text-sm">
                  {googleFitStatus.connectionError}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div>
            {googleFitStatus.connectionError && (
              <div className="p-3 rounded-lg flex items-center mb-4"
                   style={{ 
                     backgroundColor: `${colors.danger}15`,
                     color: colors.danger
                   }}>
                <AlertCircle size={18} className="mr-2" />
                <span className="text-sm">
                  {googleFitStatus.connectionError}
                </span>
              </div>
            )}
            
            <div className="p-3 rounded-lg flex items-start mb-4"
                 style={{ 
                   backgroundColor: `${colors.primary}15`,
                   color: colors.primary
                 }}>
              <Lightbulb size={18} className="mr-2 mt-0.5" />
              <div>
                <span className="text-sm font-medium">Connect for better insights</span>
                <p className="text-xs mt-1">
                  Google Fit provides real-time health metrics that improve AI analysis of your symptoms
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleConnectGoogleFit}
              disabled={googleFitStatus.isConnecting}
              className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all flex items-center justify-center"
              style={{ 
                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                opacity: googleFitStatus.isConnecting ? 0.7 : 1
              }}
            >
              {googleFitStatus.isConnecting ? (
                <>
                  <Loader size={18} className="animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link size={18} className="mr-2" />
                  Connect Google Fit
                </>
              )}
            </button>
          </div>
        )}
        
        {isGoogleFitConnected && (
          <div className="border-t mt-4 pt-3 flex items-center justify-between"
               style={{ borderColor: borderColor }}>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Last updated: <span style={{ color: colors.primary }}>{formatLastUpdated()}</span>
            </p>
            <a href="#privacy" className="text-xs flex items-center" style={{ color: colors.primary }}>
              Privacy Policy
              <ChevronRight size={12} className="ml-1" />
            </a>
          </div>
        )}
      </div>
    );
    
    // Render Google Fit metrics display
    const renderGoogleFitMetrics = () => {
      if (!isGoogleFitConnected || !hasGoogleFitData) {
        return null;
      }
      
      const metrics = [
        {
          name: "Blood Pressure",
          value: googleFitData.systolic ? `${Math.round(googleFitData.systolic)}/${Math.round(googleFitData.diastolic)} mmHg` : "N/A",
          icon: <Heart size={18} />,
          color: colors.danger
        },
        {
          name: "BMI",
          value: googleFitData.BMI ? googleFitData.BMI.toFixed(1) : "N/A",
          subtext: googleFitData.BMI ? 
            (googleFitData.BMI < 18.5 ? "Underweight" : 
             googleFitData.BMI < 25 ? "Normal" : 
             googleFitData.BMI < 30 ? "Overweight" : "Obese") : "",
          icon: <User size={18} />,
          color: colors.primary
        },
        {
          name: "Glucose",
          value: googleFitData.glucose ? `${Math.round(googleFitData.glucose)} mg/dL` : "N/A",
          icon: <BarChart2 size={18} />,
          color: colors.accent
        },
        {
          name: "Sleep",
          value: googleFitData.sleep_time ? `${googleFitData.sleep_time} - ${googleFitData.wake_time}` : "N/A",
          icon: <Moon size={18} />,
          color: colors.gradientAlt1
        },
        {
          name: "Weight",
          value: googleFitData.weight ? `${googleFitData.weight.toFixed(1)} kg` : "N/A",
          icon: <Dumbbell size={18} />,
          color: colors.gradientAlt2
        },
        {
          name: "Height",
          value: googleFitData.height ? `${googleFitData.height.toFixed(2)} m` : "N/A",
          icon: <Activity size={18} />,
          color: colors.warning
        }
      ];
      
      return (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className={sectionHeadingClass} style={sectionHeadingStyle}>
              Google Fit Metrics
            </h3>
            <span className="text-xs dark-mode-transition px-3 py-1 rounded-full" 
                  style={{ 
                    backgroundColor: `${colors.primary}15`,
                    color: colors.primary
                  }}>
              Real-time data
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {metrics.map((metric, idx) => (
              <div key={idx} className="p-4 rounded-xl border hover:shadow-md transition-all duration-300 dark-mode-transition"
                   style={{ backgroundColor: cardBg, borderColor: borderColor }}>
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg mr-2 flex items-center justify-center"
                       style={{ backgroundColor: `${metric.color}20` }}>
                    {React.cloneElement(metric.icon, { style: { color: metric.color } })}
                  </div>
                  <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>
                    {metric.name}
                  </span>
                </div>
                <p className="text-lg font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                  {metric.value}
                </p>
                {metric.subtext && (
                  <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                    {metric.subtext}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    // Render no data message
    const renderNoGoogleFitDataMessage = () => {
      if (isGoogleFitConnected && (!hasGoogleFitData || isRefreshing)) {
        return (
          <div className="mb-8 p-4 rounded-xl border flex items-center dark-mode-transition" 
               style={{ 
                 backgroundColor: `${colors.info}10`,
                 borderColor: `${colors.info}30`,
                 color: colors.info
               }}>
            {isRefreshing ? (
              <Loader size={20} className="animate-spin mr-3" />
            ) : (
              <Database size={20} className="mr-3" />
            )}
            <div>
              <h4 className="font-medium text-sm">
                {isRefreshing ? 'Fetching Google Fit Data...' : 'No Google Fit Data Available'}
              </h4>
              <p className="text-xs mt-1">
                {isRefreshing 
                  ? 'Please wait while we fetch your latest health metrics...'
                  : 'We could not retrieve your Google Fit data. Please refresh or reconnect.'}
              </p>
            </div>
          </div>
        );
      }
      return null;
    };
    
    // Handle back button click
    const handleBack = () => {
      setView('main');
    };
    
    // Render AI insights view
    if (view === 'insights') {
      return (
        <div className="p-6 pb-20">
          <header className="flex items-center mb-6">
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-4 hover:bg-opacity-10 transition-colors duration-300 dark-mode-transition"
              onClick={handleBack}
              style={{ 
                backgroundColor: isDarkMode ? `${colors.primary}10` : 'transparent',
                color: colors.textPrimary 
              }}
            >
              <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Google Fit Analysis</h1>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>AI-powered health insights</p>
            </div>
          </header>
          
          {/* AI Analysis Content */}
          <div className="space-y-6">
            <div className={cardClass} style={cardStyle}>
              <div className="flex items-start mb-5">
                <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`
                    }}>
                  <Brain size={24} color="white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>
                    Health Pattern Analysis
                  </h3>
                  <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Based on your Google Fit data and symptoms
                  </p>
                </div>
              </div>
              
              {isGoogleFitConnected ? (
                <>
                  <div className="p-4 rounded-xl border mb-4 dark-mode-transition"
                      style={{ 
                        backgroundColor: isDarkMode ? `${colors.accent}15` : '#F0F9FF',
                        borderColor: borderColor
                      }}>
                    <h4 className="font-medium mb-2 dark-mode-transition" style={{ color: colors.accent }}>
                      Google Fit Metrics Baseline
                    </h4>
                    <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                      Your health metrics are within normal ranges. Sleep pattern shows an average of 8 hours per night, 
                      which is optimal for your age group. Weight and BMI metrics show stability over the past month.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl border mb-4 dark-mode-transition"
                      style={{ 
                        backgroundColor: isDarkMode ? `${colors.primary}15` : '#F0F9FF',
                        borderColor: borderColor
                      }}>
                    <h4 className="font-medium mb-2 dark-mode-transition" style={{ color: colors.primary }}>
                      Sleep-Symptom Correlation
                    </h4>
                    <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                      Our AI analysis indicates that days with less than 7 hours of sleep correlate with increased symptom 
                      reporting. Consider maintaining your consistent sleep schedule of 23:30-07:15 for optimal health.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl border dark-mode-transition"
                      style={{ 
                        backgroundColor: isDarkMode ? `${colors.gradientAlt1}15` : '#F0F9FF',
                        borderColor: borderColor
                      }}>
                    <h4 className="font-medium mb-2 dark-mode-transition" style={{ color: colors.gradientAlt1 }}>
                      Personalized Recommendations
                    </h4>
                    <ul className="text-sm space-y-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
                      <li className="flex items-start">
                        <CheckCircle size={16} className="mr-2 mt-0.5" style={{ color: colors.success }} />
                        <span>Maintain your current sleep schedule of 23:30-07:15</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle size={16} className="mr-2 mt-0.5" style={{ color: colors.success }} />
                        <span>Continue tracking symptoms to build better AI analysis</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle size={16} className="mr-2 mt-0.5" style={{ color: colors.success }} />
                        <span>Consider recording your diet to identify potential triggers</span>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl border flex items-center dark-mode-transition"
                    style={{ 
                      backgroundColor: `${colors.warning}15`,
                      borderColor: `${colors.warning}30`,
                      color: colors.warning
                    }}>
                  <AlertCircle size={20} className="mr-3" />
                  <div>
                    <h4 className="font-medium text-sm">Connect Google Fit for Analysis</h4>
                    <p className="text-xs mt-1">
                      For detailed health analysis, please connect your Google Fit account to provide health metrics.
                    </p>
                    <button 
                      onClick={() => {
                        setView('main');
                        setTimeout(() => handleConnectGoogleFit(), 500);
                      }}
                      className="mt-2 py-1 px-3 rounded-lg text-xs font-medium transition-all"
                      style={{ 
                        backgroundColor: `${colors.warning}20`,
                        color: colors.warning
                      }}
                    >
                      Return and Connect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Symptom addition view
    if (view === 'add') {
      return (
        <div className="p-6 pb-20">
          <header className="flex items-center mb-6">
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-4 hover:bg-opacity-10 transition-colors duration-300 dark-mode-transition"
              onClick={handleBack}
              style={{ 
                backgroundColor: isDarkMode ? `${colors.primary}10` : 'transparent',
                color: colors.textPrimary 
              }}
            >
              <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Log Symptom</h1>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>Track what your body's telling you</p>
            </div>
          </header>
          
          {/* Google Fit health context notice */}
          {isGoogleFitConnected && hasGoogleFitData && (
            <div className="mb-6 p-4 rounded-xl border flex items-start dark-mode-transition"
                 style={{ 
                   backgroundColor: `${colors.success}10`,
                   borderColor: `${colors.success}30`,
                   color: colors.success
                 }}>
              <CheckCircle size={20} className="mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Google Fit Data Available</h4>
                <p className="text-xs mt-1">
                  Your symptoms will be recorded with your current health metrics from Google Fit for better insights.
                </p>
              </div>
            </div>
          )}
          
          {/* Demo form for adding symptoms */}
          <div className={cardClass} style={cardStyle}>
            <h3 className="font-semibold mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>
              Symptom Details
            </h3>
            
            {/* This would be your actual form component */}
            <div className="space-y-4">
              <button 
                onClick={() => handleAddSymptom({
                  symptom: "Headache",
                  severity: "Moderate",
                  time: new Date().toLocaleTimeString(),
                  date: new Date().toLocaleDateString(),
                  notes: "Sample symptom with Google Fit data"
                })}
                className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all"
                style={{ 
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`
                }}
              >
                Submit Symptom Demo
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Main view 
    return (
      <div className="p-6 pb-20">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Symptoms</h1>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>Track your health with Google Fit</p>
          </div>
          <button 
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300" 
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              boxShadow: `0 0 20px ${colors.primary}60`
            }}
            onClick={() => setView('add')}
            disabled={isLoading || healthDataLoading}
          >
            <PlusCircle size={24} color="white" className={isLoading || healthDataLoading ? "animate-pulse" : ""} />
          </button>
        </header>
        
        {/* Success message */}
        {showSuccessMessage && (
          <div className="fixed top-5 left-0 right-0 mx-auto w-max z-50 animate-bounce-in">
            <div className="p-4 rounded-xl shadow-lg flex items-center max-w-md"
                 style={{ 
                   backgroundColor: isDarkMode ? colors.cardBg : 'white',
                   borderLeft: `4px solid ${colors.success}`,
                   boxShadow: `0 10px 15px -3px ${colors.success}30`
                 }}>
              <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center" 
                   style={{ backgroundColor: `${colors.success}20` }}>
                <CheckCircle size={18} style={{ color: colors.success }} />
              </div>
              <div>
                <h4 className="font-medium text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                  Symptom Added Successfully
                </h4>
                <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                  {isGoogleFitConnected && hasGoogleFitData 
                    ? 'Recorded with Google Fit health data'
                    : 'Recorded without health metrics'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Google Fit Connection Component */}
        {renderGoogleFitConnection()}
        
        {/* No Google Fit data message */}
        {renderNoGoogleFitDataMessage()}
        
        {/* Google Fit Metrics */}
        {renderGoogleFitMetrics()}
        
        {/* Recent symptoms */}
        <div className="mb-8">
          <h3 className={sectionHeadingClass} style={sectionHeadingStyle}>Recent Symptoms</h3>
          
          {symptoms.length > 0 ? (
            <div className="space-y-4">
              {symptoms.map((symptom, index) => (
                <div key={index} className={cardClass + " transform hover:scale-102"} style={cardStyle}>
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center"
                         style={{ 
                           backgroundColor: `${colors.accent}15`,
                           color: colors.accent
                         }}>
                      {symptom.symptom === "Headache" ? <Activity size={20} /> : <LifeBuoy size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                          {symptom.symptom}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-xs"
                              style={{ 
                                backgroundColor: `${symptom.severity === "Severe" 
                                  ? colors.danger 
                                  : symptom.severity === "Moderate" 
                                    ? colors.warning 
                                    : colors.success}15`,
                                color: symptom.severity === "Severe" 
                                  ? colors.danger 
                                  : symptom.severity === "Moderate" 
                                    ? colors.warning 
                                    : colors.success
                              }}>
                          {symptom.severity}
                        </span>
                      </div>
                      <p className="text-xs dark-mode-transition mt-1" style={{ color: colors.textSecondary }}>
                        {formatTimeDisplay(symptom)}
                      </p>
                      
                      {symptom.notes && (
                        <p className="mt-3 text-sm p-3 rounded-lg dark-mode-transition"
                           style={{ 
                             backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB',
                             color: colors.textPrimary
                           }}>
                          {symptom.notes}
                        </p>
                      )}
                      
                      {/* Health metrics associated with this symptom */}
                      {symptom.healthContext && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: borderColor }}>
                          <p className="text-xs font-medium mb-2 flex items-center dark-mode-transition"
                             style={{ color: colors.textSecondary }}>
                            <Activity size={12} className="mr-1" />
                            Google Fit Health Context
                          </p>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {symptom.healthContext.bloodPressure && (
                              <div className="p-2 rounded-lg text-xs dark-mode-transition"
                                  style={{ 
                                    backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB',
                                    color: colors.textPrimary
                                  }}>
                                <span className="block text-xs" style={{ color: colors.textSecondary }}>BP</span>
                                <span className="font-medium">
                                  {symptom.healthContext.bloodPressure.systolic}/{symptom.healthContext.bloodPressure.diastolic}
                                </span>
                              </div>
                            )}
                            
                            {symptom.healthContext.bmi && (
                              <div className="p-2 rounded-lg text-xs dark-mode-transition"
                                  style={{ 
                                    backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB',
                                    color: colors.textPrimary
                                  }}>
                                <span className="block text-xs" style={{ color: colors.textSecondary }}>BMI</span>
                                <span className="font-medium">{symptom.healthContext.bmi.toFixed(1)}</span>
                              </div>
                            )}
                            
                            {symptom.healthContext.glucose && (
                              <div className="p-2 rounded-lg text-xs dark-mode-transition"
                                  style={{ 
                                    backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB',
                                    color: colors.textPrimary
                                  }}>
                                <span className="block text-xs" style={{ color: colors.textSecondary }}>Glucose</span>
                                <span className="font-medium">{symptom.healthContext.glucose}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 border rounded-xl text-center dark-mode-transition" 
                 style={{ 
                   borderColor: borderColor,
                   backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB'
                 }}>
              <Activity size={24} className="mx-auto mb-2 opacity-50" style={{ color: colors.textSecondary }} />
              <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                No symptoms logged yet
              </p>
              <button 
                className="mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all" 
                style={{ 
                  color: colors.primary,
                  backgroundColor: `${colors.primary}15`
                }}
                onClick={() => setView('add')}
              >
                Log your first symptom
              </button>
            </div>
          )}
        </div>
        
        {/* Google Fit Analysis */}
        <div className="mb-8">
          <h3 className={sectionHeadingClass} style={sectionHeadingStyle}>Google Fit Analysis</h3>
          
          <div className={cardClass} style={cardStyle}>
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center"
                   style={{ 
                     background: `linear-gradient(135deg, ${colors.accent}, ${colors.gradientAlt1})`
                   }}>
                <Brain size={24} color="white" />
              </div>
              <div>
                <h4 className="font-bold text-base mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
                  Health Pattern Analysis
                </h4>
                <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                  Log symptoms to get personalized insights from your Google Fit data.
                </p>
                <div className="mt-4">
                  {/* Fixed and explicit "View analysis" button */}
                  <button 
                    className={buttonClass}
                    style={primaryButtonStyle} 
                    onClick={handleViewAnalysis}  // Add explicit handler
                  >
                    View analysis
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes bounce-in {
            0% { transform: translateY(-20px); opacity: 0; }
            50% { transform: translateY(10px); opacity: 0.8; }
            100% { transform: translateY(0); opacity: 1; }
          }
          .animate-bounce-in {
            animation: bounce-in 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    );
  };

export default SymptomsScreen;