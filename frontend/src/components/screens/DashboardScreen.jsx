import React, { useState, useEffect } from 'react';
import { 
  Activity, Calendar, MessageCircle, Heart, AlertTriangle, 
  Clock, Video, ChevronRight, CheckCircle, Trophy, ArrowUpRight, 
  Zap, Bell, BarChart2, Thermometer, Droplet, RefreshCw, Pill,
  TrendingUp, Hexagon, Moon, Users, BatteryCharging, CloudSun, Wind,
  BookOpen, Shield // Added BookOpen and Shield icons for education and emergency
} from 'lucide-react';
import { useHealthData } from '../HealthDataContext';
import { useApiMiddleware } from '../ApiMiddleware';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthProvider';
import supabase from '../supabaseClient';

// Enhanced Dashboard for modern health monitoring
const DashboardScreen = ({ colors, setActiveScreen }) => {
  const { isDarkMode } = useTheme();
  const { isLoading, callApi } = useApiMiddleware();
  const { user } = useAuth();
  const { 
    healthMetrics, 
    isGoogleFitConnected,
    prediction, 
    symptoms,
    lastRefreshTime,
    fetchHealthData,
    connectGoogleFit,
    biorhythmAdvice,
    environmentAdvice,
    getBiorhythmAdvice,
    getEnvironmentAdvice
  } = useHealthData();
  
  // Local state for UI
  const [refreshing, setRefreshing] = useState(false);
  const [medications, setMedications] = useState([]);
  const [upcomingMedication, setUpcomingMedication] = useState(null);
  const [loadingMedications, setLoadingMedications] = useState(true);
  const [healthScore, setHealthScore] = useState(prediction?.HealthScore || 85);
  const [refreshAnimation, setRefreshAnimation] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [energyLevel, setEnergyLevel] = useState(78);
  const [loadingEnvironment, setLoadingEnvironment] = useState(false);
  
  // Format today's date
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Load medications from Supabase on component mount
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoadingMedications(true);
        
        // Fetch real data from Supabase
        if (user) {
          const { data, error } = await supabase
            .from('user_medications')
            .select(`
              medication_id,
              name,
              dosage,
              form,
              medication_schedule(schedule_id, time, status, day_reference)
            `)
            .eq('user_id', user.id);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            // Transform Supabase data to match expected format
            const transformedMeds = data.map(med => ({
              id: med.medication_id,
              name: med.name,
              dosage: med.dosage,
              form: med.form,
              schedule: med.medication_schedule || [],
              last_taken: new Date().toISOString() // Would come from a medication_history table
            }));
            
            // Find upcoming medication
            const sortedMeds = [...transformedMeds].sort((a, b) => {
              const aNext = getNextScheduledTime(a);
              const bNext = getNextScheduledTime(b);
              
              if (!aNext) return 1;
              if (!bNext) return -1;
              
              return aNext - bNext;
            });
            
            setMedications(transformedMeds);
            setUpcomingMedication(sortedMeds[0]);
          } else {
            // If no medications in database, use fallback data for demo
            const today = new Date();
            const fallbackMeds = [
              {
                id: 1,
                name: "Metformin",
                dosage: "500mg",
                form: "Tablet",
                schedule: [
                  { time: "08:00 AM", status: "upcoming", day_reference: "daily" },
                  { time: "08:00 PM", status: "upcoming", day_reference: "daily" }
                ],
                last_taken: new Date(today.setHours(today.getHours() - 12)).toISOString()
              },
              {
                id: 2,
                name: "Lisinopril",
                dosage: "10mg",
                form: "Tablet",
                schedule: [
                  { time: "09:00 AM", status: "taken", day_reference: "daily" }
                ],
                last_taken: new Date(today.setHours(8)).toISOString()
              }
            ];
            
            setMedications(fallbackMeds);
            setUpcomingMedication(fallbackMeds[0]);
          }
        }
        
        setLoadingMedications(false);
      } catch (error) {
        console.error("Failed to fetch medications:", error);
        setLoadingMedications(false);
      }
    };
    
    fetchMedications();
    
    // Fetch or refresh biorhythm advice
    if (!biorhythmAdvice) {
      getBiorhythmAdvice('morning');
    }
    
    // Simulated energy level changes
    const energyInterval = setInterval(() => {
      setEnergyLevel(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newValue = prev + change;
        return Math.min(Math.max(newValue, 70), 95);
      });
    }, 10000);
    
    return () => clearInterval(energyInterval);
  }, [user, getBiorhythmAdvice, biorhythmAdvice]);
  
  // Update health score from prediction when available
  useEffect(() => {
    if (prediction && prediction.HealthScore) {
      setHealthScore(prediction.HealthScore);
    }
  }, [prediction]);
  
  // Fetch environment advice
  const fetchEnvironmentAdvice = async () => {
    try {
      setLoadingEnvironment(true);
      await getEnvironmentAdvice();
    } catch (error) {
      console.error('Failed to get environment advice:', error);
    } finally {
      setLoadingEnvironment(false);
    }
  };
  
  // Connect to Google Fit
  const handleConnectGoogleFit = async () => {
    try {
      await connectGoogleFit();
    } catch (error) {
      console.error('Failed to connect to Google Fit:', error);
    }
  };
  
  // Refresh health data
  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      setRefreshAnimation(true);
      await fetchHealthData();
      setRefreshing(false);
      
      // Reset animation after a delay
      setTimeout(() => {
        setRefreshAnimation(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to refresh health data:', error);
      setRefreshing(false);
      setRefreshAnimation(false);
    }
  };
  
  // Helper to get the next scheduled medication time
  const getNextScheduledTime = (medication) => {
    if (!medication?.schedule || medication.schedule.length === 0) return null;
    
    const now = new Date();
    const upcomingSchedules = medication.schedule.filter(s => s.status === 'upcoming');
    
    if (upcomingSchedules.length === 0) return null;
    
    // Find the next schedule
    for (const schedule of upcomingSchedules) {
      const [time, period] = schedule.time.split(' ');
      const [hours, minutes] = time.split(':');
      
      let scheduleHours = parseInt(hours);
      if (period === 'PM' && scheduleHours !== 12) {
        scheduleHours += 12;
      } else if (period === 'AM' && scheduleHours === 12) {
        scheduleHours = 0;
      }
      
      const scheduleTime = new Date();
      scheduleTime.setHours(scheduleHours, parseInt(minutes), 0, 0);
      
      if (scheduleTime > now) {
        return scheduleTime;
      }
    }
    
    // If no times are found for today, schedule for tomorrow
    const firstSchedule = upcomingSchedules[0];
    const [time, period] = firstSchedule.time.split(' ');
    const [hours, minutes] = time.split(':');
    
    let scheduleHours = parseInt(hours);
    if (period === 'PM' && scheduleHours !== 12) {
      scheduleHours += 12;
    } else if (period === 'AM' && scheduleHours === 12) {
      scheduleHours = 0;
    }
    
    const tomorrowSchedule = new Date();
    tomorrowSchedule.setDate(tomorrowSchedule.getDate() + 1);
    tomorrowSchedule.setHours(scheduleHours, parseInt(minutes), 0, 0);
    
    return tomorrowSchedule;
  };
  
  // Format minutes until next medication
  const formatTimeUntil = (medication) => {
    if (!medication) return "No upcoming medications";
    
    const nextTime = getNextScheduledTime(medication);
    if (!nextTime) return "No upcoming dose";
    
    const now = new Date();
    const diffMs = nextTime - now;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 60) {
      return `In ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `In ${hours} hour${hours !== 1 ? 's' : ''} ${minutes > 0 ? `and ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
    }
  };
  
  // Format blood pressure for display
  const formatBloodPressure = () => {
    if (!healthMetrics?.pressure?.systolic || !healthMetrics?.pressure?.diastolic) {
      return '120/80';
    }
    return `${Math.round(healthMetrics.pressure.systolic)}/${Math.round(healthMetrics.pressure.diastolic)}`;
  };
  
  // Get color for metric based on health status
  const getMetricColor = (metricType, value) => {
    if (!value) return colors.textSecondary;
    
    switch (metricType) {
      case 'BMI':
        if (value < 18.5 || value >= 30) return colors.danger;
        if (value >= 25) return colors.warning;
        return colors.success;
      case 'BP':
        const systolic = value.systolic;
        const diastolic = value.diastolic;
        if (!systolic || !diastolic) return colors.textSecondary;
        if (systolic >= 140 || diastolic >= 90) return colors.danger;
        if (systolic >= 130 || diastolic >= 80) return colors.warning;
        return colors.success;
      case 'GLUCOSE':
        if (value >= 126) return colors.danger;
        if (value >= 100) return colors.warning;
        if (value < 70) return colors.warning;
        return colors.success;
      default:
        return colors.primary;
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
  
  // Get color for AQI based on value
  const getAqiColor = (aqi) => {
    if (!aqi) return colors.textSecondary;
    if (aqi <= 1) return colors.success;
    if (aqi <= 3) return colors.warning;
    return colors.danger;
  };
  
  // Format AQI text
  const formatAqiText = (aqi) => {
    if (!aqi) return 'Unknown';
    if (aqi <= 1) return 'Good';
    if (aqi <= 2) return 'Fair';
    if (aqi <= 3) return 'Moderate';
    if (aqi <= 4) return 'Poor';
    return 'Very Poor';
  };
  
  return (
    <div className="px-4 pt-4 pb-20 space-y-5">
      
      
      {/* Header with welcome message */}
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ 
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Hi, {user?.name || 'there'}! 👋</h1>
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" style={{ color: colors.textSecondary }} />
            <p className="text-xs" style={{ color: colors.textSecondary }}>{today}</p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-1 rounded-full animate-pulse" 
               style={{ background: `radial-gradient(circle, ${colors.accent}50, transparent 70%)` }}></div>
          <button className="relative w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 duration-300"
                  style={{ 
                    boxShadow: `0 0 15px ${colors.primary}40`,
                    backgroundColor: isDarkMode ? colors.cardBg : 'white'
                  }}>
            <Bell size={20} style={{ color: colors.primary }} />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse"
                  style={{ backgroundColor: colors.danger }}>
              3
            </span>
          </button>
        </div>
      </header>
      
      {/* Health Score Card with 3D effect */}
      <div className="p-5 rounded-2xl relative overflow-hidden transform transition-all duration-500 hover:scale-102 group"
           style={{ 
             background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
             boxShadow: `0 15px 30px -10px ${colors.primary}70`
           }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full animate-float group-hover:animate-pulse" 
             style={{ 
               background: `radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%)`,
               transform: 'translate(30%, -30%)'
             }}></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full animate-float-delayed" 
             style={{ 
               background: `radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)`,
               transform: 'translate(-30%, 30%)'
             }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-opacity-90 text-sm font-medium">Today's Health Score</p>
            <div className="flex items-center text-xs font-medium bg-white bg-opacity-20 py-1 px-2 rounded-full backdrop-blur-sm">
              <TrendingUp size={12} className="mr-1" /> Daily Trend
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white flex items-baseline">
              {healthScore || 90}<span className="text-sm ml-1">/100</span>
            </h2>
            <div className="flex items-center text-xs font-medium bg-white bg-opacity-20 py-0.5 px-2 rounded-full backdrop-blur-sm">
              <ArrowUpRight size={10} className="mr-0.5" /> 5%
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 mb-2 w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
            <div 
              className="h-2 rounded-full shimmer-gradient" 
              style={{ 
                width: `${healthScore || 90}%`,
                background: 'rgba(255, 255, 255, 0.4)',
                transition: 'width 1.5s ease-in-out'
              }}>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-white text-opacity-80">
            <span>Critical</span>
            <span>Moderate</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>
      
      {/* Energy & Activity Card */}
      <div className="p-4 rounded-2xl border relative overflow-hidden transform transition-all duration-500 hover:scale-102 group"
           style={{ 
             backgroundColor: isDarkMode ? colors.cardBg : 'white',
             borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
             boxShadow: `0 10px 20px -5px ${colors.primary}40`
           }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full" 
             style={{ 
               background: `radial-gradient(circle, ${colors.gradientAlt1}10, transparent 70%)`,
               transform: 'translate(30%, -30%)'
             }}></div>
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div>
            <h3 className="font-bold text-base dark-mode-transition" style={{ color: colors.textPrimary }}>
              Energy & Activity
            </h3>
            <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
              Your energy levels today
            </p>
          </div>
          <div className="flex space-x-1">
            <div className="flex items-center text-xs font-medium px-2 py-1 rounded-full"
                 style={{ 
                   backgroundColor: isDarkMode ? `${colors.gradientAlt1}20` : `${colors.gradientAlt1}10`,
                   color: colors.gradientAlt1
                 }}>
              <BatteryCharging size={12} className="mr-1" /> {energyLevel}%
            </div>
          </div>
        </div>
        
        {/* Energy wave visualization */}
        <div className="h-16 mb-2 relative overflow-hidden rounded-xl"
             style={{ 
               backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
               boxShadow: `inset 0 2px 6px ${colors.primary}10`
             }}>
          <div className="absolute inset-0 flex items-end energy-wave">
            <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full">
              <path
                fill={`${colors.primary}30`}
                d="M0,50 C30,40 70,60 100,50 C130,40 170,60 200,50 C230,40 270,60 300,50 C330,40 370,60 400,50 V100 H0 Z"
              />
              <path
                fill={`${colors.primary}20`}
                d="M0,60 C30,50 70,70 100,60 C130,50 170,70 200,60 C230,50 270,70 300,60 C330,50 370,70 400,60 V100 H0 Z"
              />
            </svg>
          </div>
          
          {/* Time markers */}
          <div className="absolute inset-x-0 bottom-2 flex justify-between px-3 text-xxs" style={{ color: colors.textSecondary }}>
            <span>6AM</span>
            <span>12PM</span>
            <span>6PM</span>
            <span>Now</span>
          </div>
          
          {/* Current time indicator */}
          <div className="absolute right-3 h-full w-px bg-white" style={{ backgroundColor: colors.primary }}>
            <div className="absolute bottom-6 transform -translate-x-1/2 w-3 h-3 rounded-full"
                 style={{ backgroundColor: colors.primary }}></div>
          </div>
        </div>
        
        {/* Activity status */}
        <div className="flex justify-between">
          <div className="flex space-x-3">
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: colors.primary }}>6.3k</div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Steps</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: colors.accent }}>73<span className="text-sm">bpm</span></div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Heart Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: colors.gradientAlt1 }}>2.4<span className="text-sm">mi</span></div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Distance</div>
            </div>
          </div>
          <button className="flex items-center text-xs font-medium" style={{ color: colors.primary }}>
            Details
            <ChevronRight size={14} className="ml-0.5" />
          </button>
        </div>
      </div>
      
      {/* Environment Advice Card */}
      <div className="p-4 rounded-2xl border relative overflow-hidden transform transition-all duration-500 hover:scale-102 group"
           style={{ 
             backgroundColor: isDarkMode ? colors.cardBg : 'white',
             borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
             boxShadow: `0 10px 20px -5px ${colors.primary}40`
           }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full" 
             style={{ 
               background: `radial-gradient(circle, ${colors.gradientAlt2}10, transparent 70%)`,
               transform: 'translate(30%, -30%)'
             }}></div>
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div>
            <h3 className="font-bold text-base dark-mode-transition" style={{ color: colors.textPrimary }}>
              Environment Advice
            </h3>
            <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
              Optimize your health based on local conditions
            </p>
          </div>
          <div className="flex items-center">
            <CloudSun size={20} style={{ color: colors.gradientAlt2 }} />
          </div>
        </div>
        
        {loadingEnvironment ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw size={20} className="animate-spin mr-2" style={{ color: colors.gradientAlt2 }} />
            <span className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              Loading environment data...
            </span>
          </div>
        ) : environmentAdvice ? (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="flex-1 p-3 rounded-xl border dark-mode-transition" 
                   style={{ 
                     borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                     backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)'
                   }}>
                <div className="flex items-center mb-1">
                  <Wind size={14} className="mr-1" style={{ color: getAqiColor(environmentAdvice.aqi) }} />
                  <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>Air Quality</span>
                </div>
                <span className="text-sm font-bold dark-mode-transition" style={{ color: getAqiColor(environmentAdvice.aqi) }}>
                  {formatAqiText(environmentAdvice.aqi)}
                </span>
              </div>
              
              <div className="flex-1 p-3 rounded-xl border dark-mode-transition" 
                   style={{ 
                     borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                     backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)'
                   }}>
                <div className="flex items-center mb-1">
                  <Thermometer size={14} className="mr-1" style={{ color: colors.gradientAlt2 }} />
                  <span className="text-xs font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>Weather</span>
                </div>
                <span className="text-sm font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
                  {environmentAdvice.weather || 'Unavailable'}
                </span>
              </div>
            </div>
            
            <div className="p-3 rounded-xl border dark-mode-transition" 
                 style={{ 
                   borderColor: isDarkMode ? `${colors.gradientAlt2}30` : `${colors.gradientAlt2}30`,
                   backgroundColor: isDarkMode ? `${colors.gradientAlt2}10` : `${colors.gradientAlt2}05`
                 }}>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                {environmentAdvice.advice || "Maintain good indoor air quality with proper ventilation. Stay hydrated throughout the day, especially when temperatures rise."}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border flex items-center justify-center dark-mode-transition"
               style={{ 
                 borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                 backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.4)'
               }}>
            <button 
              onClick={fetchEnvironmentAdvice}
              className="flex items-center text-sm font-medium px-3 py-2 rounded-lg transition-all duration-300"
              style={{ 
                backgroundColor: isDarkMode ? `${colors.gradientAlt2}20` : `${colors.gradientAlt2}15`,
                color: colors.gradientAlt2
              }}
            >
              <RefreshCw size={16} className="mr-2" />
              Get Environment Advice
            </button>
          </div>
        )}
      </div>
      
      {/* Health Metrics Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>
            Health Metrics
          </h3>
          
          {isGoogleFitConnected ? (
            <button 
              onClick={handleRefreshData}
              disabled={refreshing}
              className="flex items-center text-xs font-medium px-2 py-1 rounded-full transition-all duration-300"
              style={{ 
                color: colors.primary, 
                backgroundColor: `${colors.primary}15`
              }}
            >
              <RefreshCw size={12} className={`mr-1 ${refreshAnimation ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          ) : (
            <button 
              onClick={handleConnectGoogleFit}
              className="flex items-center text-xs font-medium px-2 py-1 rounded-full transition-all duration-300"
              style={{ 
                color: colors.primary, 
                backgroundColor: `${colors.primary}15`
              }}
            >
              Connect
            </button>
          )}
        </div>
        
        {/* Metric type selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">
          <button 
            className={`px-3 py-2 text-xs font-medium rounded-xl transition-all duration-300 whitespace-nowrap flex items-center`}
            style={{ 
              backgroundColor: selectedMetric === 'all' ? `${colors.primary}20` : isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
              color: selectedMetric === 'all' ? colors.primary : colors.textSecondary
            }}
            onClick={() => setSelectedMetric('all')}
          >
            <Hexagon size={14} className="mr-1" />
            All Metrics
          </button>
          <button 
            className={`px-3 py-2 text-xs font-medium rounded-xl transition-all duration-300 whitespace-nowrap flex items-center`}
            style={{ 
              backgroundColor: selectedMetric === 'cardio' ? `${colors.accent}20` : isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
              color: selectedMetric === 'cardio' ? colors.accent : colors.textSecondary
            }}
            onClick={() => setSelectedMetric('cardio')}
          >
            <Heart size={14} className="mr-1" />
            Cardiovascular
          </button>
          <button 
            className={`px-3 py-2 text-xs font-medium rounded-xl transition-all duration-300 whitespace-nowrap flex items-center`}
            style={{ 
              backgroundColor: selectedMetric === 'metabolic' ? `${colors.gradientAlt1}20` : isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
              color: selectedMetric === 'metabolic' ? colors.gradientAlt1 : colors.textSecondary
            }}
            onClick={() => setSelectedMetric('metabolic')}
          >
            <Activity size={14} className="mr-1" />
            Metabolic
          </button>
          <button 
            className={`px-3 py-2 text-xs font-medium rounded-xl transition-all duration-300 whitespace-nowrap flex items-center`}
            style={{ 
              backgroundColor: selectedMetric === 'sleep' ? `${colors.gradientAlt2}20` : isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
              color: selectedMetric === 'sleep' ? colors.gradientAlt2 : colors.textSecondary
            }}
            onClick={() => setSelectedMetric('sleep')}
          >
            <Moon size={14} className="mr-1" />
            Sleep
          </button>
        </div>
        
        {/* Health Cards Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Blood Pressure Card */}
          <div className="p-3 rounded-xl border transition-all duration-300 transform hover:scale-102"
               style={{ 
                 backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                 borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                 boxShadow: `0 4px 6px -1px ${colors.primary}20`
               }}>
            <div className="flex items-center mb-1">
              <div className="w-7 h-7 rounded-lg mr-2 flex items-center justify-center" 
                   style={{ backgroundColor: `${colors.accent}20` }}>
                <Heart size={16} style={{ color: colors.accent }} />
              </div>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                Blood Pressure
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold" style={{ 
                color: getMetricColor('BP', healthMetrics?.pressure)
              }}>
                {formatBloodPressure()}
                <span className="text-xs font-normal ml-1" style={{ color: colors.textSecondary }}>mmHg</span>
              </p>
              <TrendingUp size={16} style={{ color: getMetricColor('BP', healthMetrics?.pressure) }} />
            </div>
          </div>
          
          {/* BMI Card */}
          <div className="p-3 rounded-xl border transition-all duration-300 transform hover:scale-102"
               style={{ 
                 backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                 borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                 boxShadow: `0 4px 6px -1px ${colors.primary}20`
               }}>
            <div className="flex items-center mb-1">
              <div className="w-7 h-7 rounded-lg mr-2 flex items-center justify-center" 
                   style={{ backgroundColor: `${colors.primary}20` }}>
                <BarChart2 size={16} style={{ color: colors.primary }} />
              </div>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                BMI
              </span>
            </div>
            <p className="text-xl font-bold" style={{ 
              color: getMetricColor('BMI', healthMetrics?.BMI)
            }}>
              {healthMetrics?.BMI ? healthMetrics.BMI.toFixed(1) : '23.0'}
            </p>
          </div>
          
          {/* Glucose Card */}
          <div className="p-3 rounded-xl border transition-all duration-300 transform hover:scale-102"
               style={{ 
                 backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                 borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                 boxShadow: `0 4px 6px -1px ${colors.primary}20`
               }}>
            <div className="flex items-center mb-1">
              <div className="w-7 h-7 rounded-lg mr-2 flex items-center justify-center" 
                   style={{ backgroundColor: `${colors.gradientAlt1}20` }}>
                <Droplet size={16} style={{ color: colors.gradientAlt1 }} />
              </div>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                Glucose
              </span>
            </div>
            <p className="text-xl font-bold" style={{ 
              color: getMetricColor('GLUCOSE', healthMetrics?.glucose)
            }}>
              {healthMetrics?.glucose ? healthMetrics.glucose.toFixed(0) : '95'}
              <span className="text-xs ml-1 font-normal" style={{ color: colors.textSecondary }}>mg/dL</span>
            </p>
          </div>
          
          {/* Sleep Card */}
          <div className="p-3 rounded-xl border transition-all duration-300 transform hover:scale-102"
               style={{ 
                 backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.6)',
                 borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                 boxShadow: `0 4px 6px -1px ${colors.primary}20`
               }}>
            <div className="flex items-center mb-1">
              <div className="w-7 h-7 rounded-lg mr-2 flex items-center justify-center" 
                   style={{ backgroundColor: `${colors.gradientAlt2}20` }}>
                <Moon size={16} style={{ color: colors.gradientAlt2 }} />
              </div>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                Sleep
              </span>
            </div>
            <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>
              {healthMetrics?.sleep?.sleep_time || '23:30'}<span className="text-xs font-normal" style={{ color: colors.textSecondary }}> - {healthMetrics?.sleep?.wake_time || '07:15'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button className="text-xs font-medium flex items-center"
                 style={{ color: colors.primary }}
                 onClick={() => setActiveScreen('health')}>
            View all metrics
            <ChevronRight size={12} className="ml-0.5" />
          </button>
        </div>
      </div>
      
      {/* Medications Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>
            Medications
          </h3>
          <button className="text-xs font-medium px-2 py-1 rounded-full transition-all duration-300"
                  style={{ color: colors.primary, backgroundColor: `${colors.primary}15` }}
                  onClick={() => setActiveScreen('medications')}>
            View all
          </button>
        </div>
        
        {loadingMedications ? (
          <div className="flex items-center justify-center py-6 rounded-xl border"
               style={{ 
                 backgroundColor: isDarkMode ? `${colors.primary}05` : 'rgba(239, 246, 255, 0.3)',
                 borderColor: isDarkMode ? `${colors.primary}20` : 'rgba(219, 234, 254, 0.6)'
               }}>
            <div className="w-5 h-5 rounded-full animate-spin mr-2" 
                 style={{ 
                   borderWidth: '2px',
                   borderStyle: 'solid',
                   borderColor: `${colors.primary}20`,
                   borderTopColor: colors.primary
                 }}></div>
            <span className="text-xs" style={{ color: colors.textPrimary }}>
              Loading medications...
            </span>
          </div>
        ) : (
          <>
            {/* Next medication */}
            {upcomingMedication && (
              <div className="p-4 rounded-xl border transition-all duration-300 transform hover:scale-102"
                   style={{ 
                     backgroundColor: isDarkMode ? `${colors.primary}10` : 'rgba(239, 246, 255, 0.4)',
                     borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 0.6)',
                     borderLeftWidth: '4px',
                     borderLeftColor: colors.primary,
                     boxShadow: `0 4px 10px ${colors.primary}15`
                   }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    Next Medication
                  </h4>
                  <div className="text-xs px-2 py-1 rounded-full font-medium"
                       style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                    {formatTimeUntil(upcomingMedication)}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg mr-3 flex items-center justify-center" 
                       style={{ 
                         background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                         boxShadow: `0 4px 6px ${colors.primary}30`
                       }}>
                    <Pill size={20} color="white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {upcomingMedication.name} {upcomingMedication.dosage}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {upcomingMedication.form} • Take with food
                    </p>
                  </div>
                  <button 
                    className="ml-auto w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                      boxShadow: `0 4px 6px ${colors.primary}30`
                    }}
                    onClick={() => setActiveScreen('medications')}
                  >
                    <CheckCircle size={16} color="white" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Medication adherence */}
            <div className="p-3 rounded-xl border transition-all duration-300"
                 style={{ 
                   backgroundColor: isDarkMode ? colors.cardBg : 'white',
                   borderColor: isDarkMode ? `${colors.primary}20` : 'rgba(219, 234, 254, 0.6)',
                   boxShadow: `0 4px 6px ${colors.primary}10`
                 }}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  Medication Adherence
                </h4>
                <div className="text-xs px-2 py-0.5 rounded-full font-medium"
                     style={{ backgroundColor: `${colors.success}20`, color: colors.success }}>
                  92% This Week
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {['M','T','W','T','F','S','S'].map((day, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-xs mb-1" style={{ color: colors.textSecondary }}>{day}</div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${index < 5 ? 'text-white' : ''}`}
                         style={{ 
                           backgroundColor: index < 5 ? colors.success : (isDarkMode ? `${colors.primary}15` : 'rgba(239, 246, 255, 0.6)'),
                           color: index < 5 ? 'white' : colors.textSecondary
                         }}>
                      {index < 5 ? <CheckCircle size={12} /> : day}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Quick actions section - NOW UPDATED WITH EDUCATION AND EMERGENCY BUTTONS */}
      <div className="space-y-3">
        <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Log Symptoms Button */}
          <button className="p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-102"
                  style={{ 
                    backgroundColor: isDarkMode ? `${colors.danger}10` : `${colors.danger}05`,
                    borderColor: isDarkMode ? `${colors.danger}30` : `${colors.danger}20`,
                    color: colors.danger,
                    boxShadow: `0 4px 6px ${colors.danger}10`
                  }}
                  onClick={() => setActiveScreen('symptoms')}>
            <Heart size={20} className="mb-1" />
            <span className="text-xs font-medium">Log Symptoms</span>
          </button>
          
          {/* Biorhythms Button */}
          <button className="p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-102"
                  style={{ 
                    backgroundColor: isDarkMode ? `${colors.accent}10` : `${colors.accent}05`,
                    borderColor: isDarkMode ? `${colors.accent}30` : `${colors.accent}20`,
                    color: colors.accent,
                    boxShadow: `0 4px 6px ${colors.accent}10`
                  }}
                  onClick={() => setActiveScreen('biorhythm')}>
            <Clock size={20} className="mb-1" />
            <span className="text-xs font-medium">Biorhythms</span>
          </button>
          
          {/* NEW Education Button */}
          <button className="p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-102"
                  style={{ 
                    backgroundColor: isDarkMode ? `${colors.gradientAlt1}10` : `${colors.gradientAlt1}05`,
                    borderColor: isDarkMode ? `${colors.gradientAlt1}30` : `${colors.gradientAlt1}20`,
                    color: colors.gradientAlt1,
                    boxShadow: `0 4px 6px ${colors.gradientAlt1}10`
                  }}
                  onClick={() => setActiveScreen('education')}>
            <BookOpen size={20} className="mb-1" />
            <span className="text-xs font-medium">Education</span>
          </button>
          
          {/* NEW Emergency Button */}
          <button className="p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-102"
                  style={{ 
                    backgroundColor: isDarkMode ? `${colors.warning}10` : `${colors.warning}05`,
                    borderColor: isDarkMode ? `${colors.warning}30` : `${colors.warning}20`,
                    color: colors.warning,
                    boxShadow: `0 4px 6px ${colors.warning}10`
                  }}
                  onClick={() => setActiveScreen('emergency')}>
            <Shield size={20} className="mb-1" />
            <span className="text-xs font-medium">Emergency</span>
          </button>
        </div>
      </div>
      
      {/* Biorhythm preview */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>
            Biorhythm
          </h3>
          <button className="text-xs font-medium px-2 py-1 rounded-full transition-all duration-300"
                  style={{ color: colors.primary, backgroundColor: `${colors.primary}15` }}
                  onClick={() => setActiveScreen('biorhythm')}>
            View details
          </button>
        </div>
        
        <div className="p-4 rounded-xl border transition-all duration-300 transform hover:scale-102"
             style={{ 
               backgroundColor: isDarkMode ? colors.cardBg : 'white',
               borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
               boxShadow: `0 8px 16px -4px ${colors.primary}20`
             }}>
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-lg mr-3 flex items-center justify-center shimmer" 
                 style={{ 
                   background: `linear-gradient(135deg, ${colors.gradientAlt1}, ${colors.gradientAlt2})`
                 }}>
              <Zap size={20} color="white" />
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                {biorhythmAdvice ? "Today's Peak Time" : "Optimize Your Day"}
              </h4>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {biorhythmAdvice ? '2-4 PM (Exercise)' : 'Connect to optimize your activities'}
              </p>
            </div>
          </div>
          
          {/* Biorhythm visualization */}
          {biorhythmAdvice && (
            <div className="mb-3 h-16 relative">
              <div className="absolute inset-x-0 bottom-0 flex items-end">
                <div className="flex-1 h-6 rounded-l-lg" style={{ backgroundColor: `${colors.primary}30` }}></div>
                <div className="flex-1 h-10 bg-gradient-to-t transition-all" 
                     style={{ 
                       backgroundImage: `linear-gradient(to top, ${colors.primary}50, ${colors.primary}20)`,
                       boxShadow: `0 -4px 6px ${colors.primary}20`
                     }}></div>
                <div className="flex-1 h-14 bg-gradient-to-t transition-all" 
                     style={{ 
                       backgroundImage: `linear-gradient(to top, ${colors.accent}50, ${colors.accent}20)`,
                       boxShadow: `0 -4px 6px ${colors.accent}20`
                     }}></div>
                <div className="flex-1 h-10 bg-gradient-to-t transition-all" 
                     style={{ 
                       backgroundImage: `linear-gradient(to top, ${colors.primary}50, ${colors.primary}20)`,
                       boxShadow: `0 -4px 6px ${colors.primary}20`
                     }}></div>
                <div className="flex-1 h-6 rounded-r-lg" style={{ backgroundColor: `${colors.primary}30` }}></div>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex justify-between text-xxs px-2" style={{ color: colors.textSecondary }}>
                <span>8AM</span>
                <span>12PM</span>
                <span>3PM</span>
                <span>6PM</span>
                <span>9PM</span>
              </div>
              <div className="absolute left-1/2 bottom-0 w-0.5 h-16 transform -translate-x-1/2"
                   style={{ backgroundColor: `${colors.success}60` }}>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full animate-pulse"
                     style={{ backgroundColor: colors.success }}></div>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full animate-ping opacity-30"
                     style={{ backgroundColor: colors.success }}></div>
              </div>
            </div>
          )}
          
          <button 
            className="w-full py-2 rounded-lg text-white text-xs font-medium transition-all duration-300 transform hover:scale-102 flex items-center justify-center"
            style={{ 
              background: `linear-gradient(to right, ${colors.gradientAlt1}, ${colors.gradientAlt2})`,
              boxShadow: `0 4px 8px ${colors.gradientAlt1}40`
            }}
            onClick={() => setActiveScreen('biorhythm')}
          >
            See optimal times
          </button>
        </div>
      </div>
      
      {/* Social component */}
      <div className="p-4 rounded-xl border transition-all duration-300 mt-6"
           style={{ 
             backgroundColor: isDarkMode ? colors.cardBg : 'white',
             borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
             boxShadow: `0 8px 16px -4px ${colors.primary}20`
           }}>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-bold" style={{ color: colors.textPrimary }}>Community Support</h4>
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 dark-mode-transition"
                     style={{ 
                       backgroundColor: `${colors.primary}${20*i}`,
                       borderColor: isDarkMode ? colors.cardBg : 'white'
                     }}></div>
              ))}
            </div>
            <span className="text-xs ml-1" style={{ color: colors.textSecondary }}>+42</span>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-lg mr-3 flex items-center justify-center" 
               style={{ backgroundColor: `${colors.gradientAlt1}20` }}>
            <Users size={18} style={{ color: colors.gradientAlt1 }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Join others with similar health goals in our supportive community
            </p>
          </div>
          <button className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                 style={{ 
                   background: `linear-gradient(to right, ${colors.gradientAlt1}, ${colors.gradientAlt2})`,
                   boxShadow: `0 2px 4px ${colors.gradientAlt1}30`
                 }}>
            Join
          </button>
        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes waveAnimation {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
        .shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
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
        .energy-wave {
          animation: waveAnimation 15s linear infinite;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .text-xxs {
          font-size: 0.625rem;
        }
      `}</style>
    </div>
  );
};

export default DashboardScreen;