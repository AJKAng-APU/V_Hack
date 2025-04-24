import React from 'react';
import { Heart, Activity, Scale, Droplet, Moon, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useHealthData } from './HealthDataContext';
import { useTheme } from './ThemeContext';

const HealthMetricsPanel = ({ colors }) => {
  const { isDarkMode } = useTheme();
  const { healthMetrics, loading, isGoogleFitConnected } = useHealthData();
  
  // Style variables for dark mode
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  
  // Format weight with units
  const formatWeight = (weight) => {
    if (!weight) return 'N/A';
    return `${weight.toFixed(1)} kg`;
  };
  
  // Format height with units
  const formatHeight = (height) => {
    if (!height) return 'N/A';
    return `${height.toFixed(2)} m`;
  };
  
  // Format BMI with interpretation
  const formatBMI = (bmi) => {
    if (!bmi) return 'N/A';
    
    let interpretation = '';
    if (bmi < 18.5) interpretation = 'Underweight';
    else if (bmi < 25) interpretation = 'Normal';
    else if (bmi < 30) interpretation = 'Overweight';
    else interpretation = 'Obese';
    
    return `${bmi.toFixed(1)} (${interpretation})`;
  };
  
  // Format blood pressure
  const formatBloodPressure = (systolic, diastolic) => {
    if (!systolic || !diastolic) return 'N/A';
    return `${Math.round(systolic)}/${Math.round(diastolic)} mmHg`;
  };
  
  // Format glucose
  const formatGlucose = (glucose) => {
    if (!glucose) return 'N/A';
    return `${glucose.toFixed(1)} mg/dL`;
  };
  
  // Get color for a metric based on health status
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

  // Get trend icon based on metric status
  const getTrendIcon = (metricType, value) => {
    if (!value) return null;
    
    switch (metricType) {
      case 'BMI':
        if (value < 18.5 || value >= 25) 
          return <AlertCircle size={16} className="ml-1" />;
        return <TrendingUp size={16} className="ml-1" />;
      case 'BP':
        const systolic = value.systolic;
        const diastolic = value.diastolic;
        if (!systolic || !diastolic) return null;
        if (systolic >= 130 || diastolic >= 80) 
          return <TrendingUp size={16} className="ml-1" />;
        return <TrendingDown size={16} className="ml-1" />;
      case 'GLUCOSE':
        if (value >= 100 || value < 70) 
          return <AlertCircle size={16} className="ml-1" />;
        return <TrendingDown size={16} className="ml-1" />;
      default:
        return null;
    }
  };
  
  // Loading state or not connected state
  if (loading) {
    return (
      <div className="rounded-2xl shadow-lg border p-5 dark-mode-transition" style={{ 
        backgroundColor: cardBg,
        borderColor: borderColor,
        boxShadow: `0 10px 15px -3px ${colors.primary}20`
      }}>
        <div className="flex items-center justify-center py-8">
          <Activity size={24} className="animate-pulse mr-3" style={{ color: colors.primary }} />
          <span className="dark-mode-transition" style={{ color: colors.textPrimary }}>Loading health metrics...</span>
        </div>
      </div>
    );
  }
  
  if (!isGoogleFitConnected) {
    return null; // Don't show this panel if not connected to Google Fit
  }
  
  return (
    <div className="rounded-2xl shadow-lg border overflow-hidden transform hover:scale-105 transition-all duration-500 dark-mode-transition" style={{ 
      backgroundColor: cardBg,
      borderColor: borderColor,
      boxShadow: `0 10px 15px -3px ${colors.primary}30`
    }}>
      <div className="p-5">
        <h3 className="font-bold text-lg mb-5 dark-mode-transition" style={{ color: colors.textPrimary }}>
          Your Health Metrics
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* BMI Metric Card */}
          <div className="p-3 rounded-xl border dark-mode-transition" style={{ 
            borderColor: borderColor,
            backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: `0 10px 15px -3px ${colors.primary}20`
            }
          }}>
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center" style={{ 
                backgroundColor: `${colors.primary}20`
              }}>
                <Scale size={18} style={{ color: colors.primary }} />
              </div>
              <span className="text-sm font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                BMI
              </span>
            </div>
            <div className="flex items-center">
              <p className="text-lg font-bold" style={{ 
                color: getMetricColor('BMI', healthMetrics.BMI)
              }}>
                {formatBMI(healthMetrics.BMI)}
              </p>
              <span style={{ color: getMetricColor('BMI', healthMetrics.BMI) }}>
                {getTrendIcon('BMI', healthMetrics.BMI)}
              </span>
            </div>
          </div>
          
          {/* Blood Pressure Metric Card */}
          <div className="p-3 rounded-xl border dark-mode-transition" style={{ 
            borderColor: borderColor,
            backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: `0 10px 15px -3px ${colors.accent}20`
            }
          }}>
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center" style={{ 
                backgroundColor: `${colors.accent}20`
              }}>
                <Heart size={18} style={{ color: colors.accent }} />
              </div>
              <span className="text-sm font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                Blood Pressure
              </span>
            </div>
            <div className="flex items-center">
              <p className="text-lg font-bold" style={{ 
                color: getMetricColor('BP', healthMetrics.pressure)
              }}>
                {formatBloodPressure(healthMetrics.pressure.systolic, healthMetrics.pressure.diastolic)}
              </p>
              <span style={{ color: getMetricColor('BP', healthMetrics.pressure) }}>
                {getTrendIcon('BP', healthMetrics.pressure)}
              </span>
            </div>
          </div>
          
          {/* Glucose Metric Card */}
          <div className="p-3 rounded-xl border dark-mode-transition" style={{ 
            borderColor: borderColor,
            backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: `0 10px 15px -3px ${colors.gradientAlt1}20`
            }
          }}>
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center" style={{ 
                backgroundColor: `${colors.gradientAlt1}20`
              }}>
                <Droplet size={18} style={{ color: colors.gradientAlt1 }} />
              </div>
              <span className="text-sm font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                Glucose
              </span>
            </div>
            <div className="flex items-center">
              <p className="text-lg font-bold" style={{ 
                color: getMetricColor('GLUCOSE', healthMetrics.glucose)
              }}>
                {formatGlucose(healthMetrics.glucose)}
              </p>
              <span style={{ color: getMetricColor('GLUCOSE', healthMetrics.glucose) }}>
                {getTrendIcon('GLUCOSE', healthMetrics.glucose)}
              </span>
            </div>
          </div>
          
          {/* Sleep Metric Card */}
          <div className="p-3 rounded-xl border dark-mode-transition" style={{ 
            borderColor: borderColor,
            backgroundColor: isDarkMode ? `${colors.primary}10` : '#F9FAFB',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: `0 10px 15px -3px ${colors.gradientAlt2}20`
            }
          }}>
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center" style={{ 
                backgroundColor: `${colors.gradientAlt2}20`
              }}>
                <Moon size={18} style={{ color: colors.gradientAlt2 }} />
              </div>
              <span className="text-sm font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                Sleep
              </span>
            </div>
            <p className="text-sm font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
              {healthMetrics.sleep.sleep_time || 'N/A'} - {healthMetrics.sleep.wake_time || 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer with last sync info */}
      <div className="px-5 py-3 border-t flex items-center justify-between dark-mode-transition" style={{ 
        borderColor: borderColor,
        backgroundColor: isDarkMode ? `${colors.primary}15` : '#F0F9FF'
      }}>
        <div className="flex items-center">
          <Activity size={16} className="mr-2 animate-pulse" style={{ color: colors.primary }} />
          <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
            Synced from Google Fit
          </p>
        </div>
        <button className="text-xs font-medium px-3 py-1 rounded-full transition-colors duration-300" 
                style={{ 
                  backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10`,
                  color: colors.primary 
                }}>
          View more metrics
        </button>
      </div>

      {/* Style for interactive hover effects */}
      <style jsx>{`
        .metric-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .metric-card:hover {
          transform: translateY(-5px);
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default HealthMetricsPanel;