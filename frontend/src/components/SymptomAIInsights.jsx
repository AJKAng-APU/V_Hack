import React, { useState, useEffect } from 'react';
import { 
  Zap, ChevronRight, BrainCircuit, Clock, AlertTriangle, 
  CheckCircle, TrendingUp, MessageSquare, Brain, LineChart, 
  Wifi, WifiOff, RefreshCw, Activity 
} from 'lucide-react';
import { useHealthData } from './HealthDataContext';
import { useTheme } from './ThemeContext';
import { useApiMiddleware } from './ApiMiddleware';

const SymptomAIInsights = ({ colors }) => {
  const { isDarkMode } = useTheme();
  const { 
    callApiWithOptions, 
    isLoading, 
    offline
  } = useApiMiddleware();
  
  const { 
    aiInsights, 
    prediction, 
    biorhythmAdvice, 
    getBiorhythmAdvice, 
    loading: healthDataLoading,
    isGoogleFitConnected
  } = useHealthData();
  
  const [chronotype, setChronotype] = useState('morning');
  const [showAiExplanation, setShowAiExplanation] = useState(false);
  const [fetchingBiorhythm, setFetchingBiorhythm] = useState(false);
  const [biorhythmError, setBiorhythmError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Style variables for dark mode
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  
  // Fetch biorhythm advice on component mount
  useEffect(() => {
    if (!biorhythmAdvice && !fetchingBiorhythm) {
      handleFetchBiorhythmAdvice(chronotype);
    }
  }, []);
  
  // Get biorhythm advice when chronotype changes
  const handleChronotypeChange = async (e) => {
    const newChronotype = e.target.value;
    setChronotype(newChronotype);
    handleFetchBiorhythmAdvice(newChronotype);
  };
  
  // Handle fetching biorhythm advice with error handling
  const handleFetchBiorhythmAdvice = async (chrono) => {
    try {
      setFetchingBiorhythm(true);
      setBiorhythmError(null);
      
      await getBiorhythmAdvice(chrono, '08:00'); // Default medication time
    } catch (error) {
      console.error('Failed to get biorhythm advice:', error);
      setBiorhythmError('Unable to fetch personalized biorhythm advice. Using general recommendations instead.');
    } finally {
      setFetchingBiorhythm(false);
    }
  };

  // Function to retry fetching biorhythm advice
  const retryFetchBiorhythm = async () => {
    setRetryCount(prev => prev + 1);
    await handleFetchBiorhythmAdvice(chronotype);
  };
  
  // Get risk level color based on health score
  const getRiskLevelColor = (score) => {
    if (!score) return colors.textSecondary;
    if (score >= 80) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.danger;
  };
  
  // Format risk level based on health score
  const formatRiskLevel = (score) => {
    if (!score) return 'Unknown';
    if (score >= 80) return 'Low Risk';
    if (score >= 50) return 'Moderate Risk';
    return 'High Risk';
  };
  
  if (isLoading || healthDataLoading) {
    return (
      <div className="rounded-2xl shadow-lg border p-5 dark-mode-transition" style={{ 
        backgroundColor: cardBg,
        borderColor: borderColor,
        boxShadow: `0 10px 15px -3px ${colors.primary}20`
      }}>
        <div className="flex items-center justify-center py-8">
          <BrainCircuit size={24} className="animate-pulse mr-3" style={{ color: colors.accent }} />
          <span className="dark-mode-transition" style={{ color: colors.textPrimary }}>Generating AI insights...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Offline alert - Only show when actually offline */}
      {offline && (
        <div className="rounded-xl p-4 flex items-center mb-4 dark-mode-transition"
             style={{ 
               backgroundColor: `${colors.warning}15`,
               color: colors.warning,
               border: `1px solid ${colors.warning}30`
             }}>
          <WifiOff size={18} className="mr-2" />
          <div>
            <h4 className="font-medium text-sm">You're Offline</h4>
            <p className="text-xs mt-1">Using cached data. Some features may be limited.</p>
          </div>
          <button 
            className="ml-auto p-2 rounded-full transition-colors duration-300"
            style={{ 
              backgroundColor: `${colors.warning}20`
            }}
            onClick={() => window.location.reload()}
          >
            <Wifi size={16} />
          </button>
        </div>
      )}
      
      {/* Error display for biorhythm */}
      {biorhythmError && (
        <div className="rounded-xl p-4 flex items-center mb-4 dark-mode-transition"
             style={{ 
               backgroundColor: `${colors.info}15`,
               color: colors.info,
               border: `1px solid ${colors.info}30`
             }}>
          <AlertTriangle size={18} className="mr-2" />
          <div>
            <h4 className="font-medium text-sm">Advice Limited</h4>
            <p className="text-xs mt-1">{biorhythmError}</p>
          </div>
          <button 
            className="ml-auto p-2 rounded-full transition-colors duration-300"
            style={{ 
              backgroundColor: `${colors.info}20`
            }}
            onClick={retryFetchBiorhythm}
            disabled={fetchingBiorhythm || retryCount > 2}
          >
            <RefreshCw size={16} className={fetchingBiorhythm ? "animate-spin" : ""} />
          </button>
        </div>
      )}
      
      {/* AI Model Information */}
      <div className="rounded-2xl shadow-lg border overflow-hidden transform hover:scale-102 transition-all duration-500 dark-mode-transition"
           style={{ 
             backgroundColor: cardBg,
             borderColor: borderColor,
             boxShadow: `0 10px 15px -3px ${colors.gradientAlt1}30`
           }}>
        <div className="p-5">
          <div className="flex items-start mb-4">
            <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" 
                 style={{ 
                   background: `linear-gradient(135deg, ${colors.gradientAlt1}, ${colors.gradientAlt2})`
                 }}>
              <Brain size={24} color="white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                AI Health Assistant
              </h3>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                Powered by advanced health analytics
              </p>
            </div>
          </div>
          
          <div onClick={() => setShowAiExplanation(!showAiExplanation)}
               className="p-4 rounded-xl border mb-4 cursor-pointer transition-all duration-300 dark-mode-transition"
               style={{ 
                 borderColor: borderColor,
                 backgroundColor: isDarkMode ? `${colors.primary}15` : '#F0F9FF',
                 transform: showAiExplanation ? 'scale(1.02)' : 'scale(1)'
               }}>
            <div className="flex justify-between">
              <h4 className="font-medium dark-mode-transition" style={{ color: colors.primary }}>How AI Helps Your Health</h4>
              <ChevronRight size={18} 
                style={{ 
                  color: colors.primary,
                  transform: showAiExplanation ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}/>
            </div>
            
            {showAiExplanation && (
              <div className="mt-3 text-sm transition-all duration-300 dark-mode-transition" style={{ color: colors.textSecondary }}>
                <p className="mb-2">Our AI analyzes your symptoms, health metrics, and lifestyle factors to identify patterns and provide personalized insights.</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Pattern detection across symptoms and metrics</li>
                  <li>Personalized biorhythm optimization</li>
                  <li>Health risk assessment and prevention</li>
                  <li>Continuous learning from your data</li>
                </ul>
              </div>
            )}
          </div>
         
          <div className="flex space-x-2">
            <div className="flex-1 p-3 rounded-xl border dark-mode-transition" 
                 style={{ 
                   borderColor: borderColor,
                   backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)'
                 }}>
              <div className="flex items-center mb-1">
                <BrainCircuit size={14} className="mr-1" style={{ color: colors.accent }} />
                <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>Pattern Detection</span>
              </div>
              <span className="text-sm font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                {aiInsights ? 'Available' : 'Learning'}
              </span>
            </div>
            
            <div className="flex-1 p-3 rounded-xl border dark-mode-transition" 
                 style={{ 
                   borderColor: borderColor,
                   backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)'
                 }}>
              <div className="flex items-center mb-1">
                <MessageSquare size={14} className="mr-1" style={{ color: colors.primary }} />
                <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>Google Fit</span>
              </div>
              <span className="text-sm font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                {isGoogleFitConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex-1 p-3 rounded-xl border dark-mode-transition" 
                 style={{ 
                   borderColor: borderColor,
                   backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)'
                 }}>
              <div className="flex items-center mb-1">
                <LineChart size={14} className="mr-1" style={{ color: colors.gradientAlt1 }} />
                <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>Predictions</span>
              </div>
              <span className="text-sm font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                {prediction ? 'Available' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Score & Prediction Card */}
      {prediction && (
        <div className="rounded-2xl shadow-lg border overflow-hidden transform hover:scale-105 transition-all duration-500 dark-mode-transition" style={{ 
          backgroundColor: cardBg,
          borderColor: borderColor,
          boxShadow: `0 10px 15px -3px ${colors.primary}30`
        }}>
          <div className="p-5">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
              }}>
                <CheckCircle size={24} color="white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                  Health Score & Risk Assessment
                </h3>
                <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                  AI-powered analysis of your health metrics
                </p>
              </div>
            </div>
            
            {/* Health Score Display */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>
                  Your Health Score
                </span>
                <span className="font-medium px-3 py-1 rounded-full text-xs" style={{ 
                  backgroundColor: `${getRiskLevelColor(prediction.HealthScore)}20`,
                  color: getRiskLevelColor(prediction.HealthScore)
                }}>
                  {formatRiskLevel(prediction.HealthScore)}
                </span>
              </div>
              
              {/* Health Score Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-1 overflow-hidden dark-mode-transition" style={{
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }}>
                <div 
                  className="h-4 rounded-full shimmer-gradient" 
                  style={{ 
                    width: `${prediction.HealthScore || 0}%`,
                    background: `linear-gradient(to right, ${colors.danger}, ${colors.warning}, ${colors.success})`,
                    transition: 'width 1.5s ease-in-out'
                  }}>
                </div>
              </div>
              <div className="flex justify-between text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
            
            {/* Health Advice */}
            <div className="p-4 rounded-xl border dark-mode-transition" style={{ 
              borderColor: borderColor,
              backgroundColor: isDarkMode ? `${colors.primary}15` : '#F0F9FF'
            }}>
              <h4 className="font-medium mb-2 dark-mode-transition" style={{ color: colors.primary }}>Health Advice</h4>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                {prediction.advice || "Let's be honest — with your current metrics, you're doing okay, but there's always room for improvement. Focus on consistent exercise, watch your diet, and make sure you're getting enough sleep."}
              </p>
            </div>
          </div>
          
          {/* Footer with generated time */}
          <div className="px-5 py-3 border-t flex items-center justify-between dark-mode-transition" style={{ 
            borderColor: borderColor,
            backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB'
          }}>
            <div className="flex items-center">
              <Clock size={14} className="mr-2" style={{ color: colors.textSecondary }} />
              <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                Generated {new Date().toLocaleString()}
              </p>
            </div>
            <button className="text-xs font-medium flex items-center transition-colors duration-300" style={{ color: colors.primary }}>
              Get detailed report
              <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
        </div>
      )}
      
      {/* Symptom Insights Card */}
      {aiInsights && (
        <div className="rounded-2xl shadow-lg border overflow-hidden transform hover:scale-105 transition-all duration-500 dark-mode-transition" style={{ 
          backgroundColor: cardBg,
          borderColor: borderColor,
          boxShadow: `0 10px 15px -3px ${colors.primary}30`
        }}>
          <div className="p-5">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" style={{ 
                background: `linear-gradient(135deg, ${colors.gradientAlt1}, ${colors.gradientAlt2})`
              }}>
                <Zap size={24} color="white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                  Symptom Insights
                </h3>
                <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                  AI analysis of your recent symptoms
                </p>
              </div>
            </div>
            
            {/* Insight Content */}
            <div className="mb-4 p-4 rounded-xl border dark-mode-transition" style={{ 
              borderColor: borderColor,
              backgroundColor: isDarkMode ? `${colors.gradientAlt1}15` : '#F0F9FF'
            }}>
              <h4 className="font-medium mb-2 flex items-center dark-mode-transition" style={{ color: colors.gradientAlt1 }}>
                <TrendingUp size={16} className="mr-2" />
                Pattern Detected
              </h4>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                {aiInsights.pattern || "Your headaches tend to occur after extended screen time and coincide with elevated blood pressure readings. Consider the 20-20-20 rule (every 20 minutes, look at something 20 feet away for 20 seconds)."}
              </p>
            </div>
            
            {/* Recommendation */}
            <div className="p-4 rounded-xl border dark-mode-transition" style={{ 
              borderColor: borderColor,
              backgroundColor: isDarkMode ? `${colors.primary}15` : '#F0F9FF'
            }}>
              <h4 className="font-medium mb-2 flex items-center dark-mode-transition" style={{ color: colors.primary }}>
                <AlertTriangle size={16} className="mr-2" />
                Recommended Action
              </h4>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                {aiInsights.recommendation || "Track your water intake and consider discussing these symptoms with your doctor if they persist more than 3 days. Your glucose levels suggest this may be connected to blood sugar fluctuations."}
              </p>
            </div>
          </div>
          
          {/* Footer with generated time */}
          <div className="px-5 py-3 border-t flex items-center justify-between dark-mode-transition" style={{ 
            borderColor: borderColor,
            backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB'
          }}>
            <div className="flex items-center">
              <BrainCircuit size={14} className="mr-2" style={{ color: colors.textSecondary }} />
              <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                AI-generated insight
              </p>
            </div>
            <button className="text-xs font-medium flex items-center transition-colors duration-300" style={{ color: colors.primary }}>
              More insights
              <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
        </div>
      )}
      
      {/* Biorhythm Advice Card */}
      <div className="rounded-2xl shadow-lg border overflow-hidden transform hover:scale-105 transition-all duration-500 dark-mode-transition" style={{ 
        backgroundColor: cardBg,
        borderColor: borderColor,
        boxShadow: `0 10px 15px -3px ${colors.primary}30`
      }}>
        <div className="p-5">
          <div className="flex items-start mb-4">
            <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
            }}>
              <Clock size={24} color="white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Biorhythm Optimization
              </h3>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                Personalized timing recommendations
              </p>
            </div>
          </div>
          
          {/* Chronotype Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
              Your Chronotype
            </label>
            <select 
              value={chronotype}
              onChange={handleChronotypeChange}
              disabled={fetchingBiorhythm}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300 dark-mode-transition"
              style={{ 
                backgroundColor: isDarkMode ? colors.darkBg : 'white',
                borderColor: borderColor,
                color: colors.textPrimary,
                opacity: fetchingBiorhythm ? 0.7 : 1
              }}
            >
              <option value="morning">Morning Person (Early Bird)</option>
              <option value="evening">Evening Person (Night Owl)</option>
              <option value="intermediate">Intermediate Type</option>
            </select>
          </div>
          
          {/* Medication Timing */}
          <div className="p-4 rounded-xl border mb-4 dark-mode-transition" style={{ 
            borderColor: borderColor,
            backgroundColor: isDarkMode ? `${colors.accent}15` : '#F0F9FF'
          }}>
            <h4 className="font-medium mb-2 dark-mode-transition" style={{ color: colors.accent }}>Recommended Medication Timing</h4>
            {fetchingBiorhythm ? (
              <div className="flex items-center">
                <Clock size={16} className="animate-spin mr-2" style={{ color: colors.accent }} />
                <span className="text-sm">Loading recommendations...</span>
              </div>
            ) : (
              <p className="text-lg font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                {biorhythmAdvice?.medicationTime || (chronotype === 'morning' ? '08:00 - 09:00' : chronotype === 'evening' ? '18:00 - 19:00' : '12:00 - 14:00')}
              </p>
            )}
          </div>
          
          {/* Sleep Recommendation */}
          <div className="p-4 rounded-xl border dark-mode-transition" style={{ 
            borderColor: borderColor,
            backgroundColor: isDarkMode ? `${colors.primary}15` : '#F0F9FF'
          }}>
            <h4 className="font-medium mb-2 dark-mode-transition" style={{ color: colors.primary }}>Sleep Optimization</h4>
            {fetchingBiorhythm ? (
              <div className="flex items-center">
                <Clock size={16} className="animate-spin mr-2" style={{ color: colors.primary }} />
                <span className="text-sm">Loading recommendations...</span>
              </div>
            ) : (
              <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                {biorhythmAdvice?.sleepAdvice || (
                  chronotype === 'morning' 
                    ? "Try sleeping around 22:30 and waking up by 06:30 to align with your early bird chronotype."
                    : chronotype === 'evening'
                    ? "Consider shifting your sleep to 00:00 - 08:00 for better alignment with your night owl rhythm."
                    : "Maintain a stable sleep schedule around 23:00 - 07:00."
                )}
              </p>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t flex items-center justify-between dark-mode-transition" style={{ 
          borderColor: borderColor,
          backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB'
        }}>
          <div className="flex items-center">
            <BrainCircuit size={14} className="mr-2" style={{ color: colors.textSecondary }} />
            <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
              Based on chronobiology research
            </p>
          </div>
          <button className="text-xs font-medium flex items-center transition-colors duration-300" style={{ color: colors.primary }}>
            Complete assessment
            <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.2) 50%, 
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .shimmer-gradient {
          position: relative;
          overflow: hidden;
        }
        .shimmer-gradient::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.3) 50%, 
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes scale-gently {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .hover-scale {
          transition: transform 0.3s ease;
        }
        .hover-scale:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default SymptomAIInsights;