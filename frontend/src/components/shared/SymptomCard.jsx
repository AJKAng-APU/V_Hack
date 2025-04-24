import React, { useState } from 'react';
import { Heart, Clock, AlertTriangle, Thermometer, Activity, Droplet, ChevronDown, ChevronUp, Tag, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const SymptomCard = ({ symptom, severity, time, note, triggers = [], associatedSymptoms = [], healthContext, colors }) => {
  const { isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  // Get appropriate icon based on symptom type
  const getSymptomIcon = () => {
    const symptomText = symptom?.toLowerCase() || '';
    
    if (symptomText.includes('headache') || symptomText.includes('pain')) {
      return <Activity size={20} color="white" />;
    } else if (symptomText.includes('fever') || symptomText.includes('temperature')) {
      return <Thermometer size={20} color="white" />;
    } else if (symptomText.includes('nausea') || symptomText.includes('vomit') || symptomText.includes('stomach')) {
      return <Droplet size={20} color="white" />;
    } else if (symptomText.includes('dizz') || symptomText.includes('faint')) {
      return <AlertTriangle size={20} color="white" />;
    }
    
    return <Heart size={20} color="white" />;
  };
  
  // Format blood pressure for display
  const formatBloodPressure = (bp) => {
    if (!bp || !bp.systolic || !bp.diastolic) return 'N/A';
    return `${Math.round(bp.systolic)}/${Math.round(bp.diastolic)} mmHg`;
  };
  
  // Format glucose for display
  const formatGlucose = (glucose) => {
    if (!glucose) return 'N/A';
    return `${Math.round(glucose)} mg/dL`;
  };
  
  // Format BMI for display
  const formatBMI = (bmi) => {
    if (!bmi) return 'N/A';
    
    let interpretation = '';
    if (bmi < 18.5) interpretation = 'Underweight';
    else if (bmi < 25) interpretation = 'Normal';
    else if (bmi < 30) interpretation = 'Overweight';
    else interpretation = 'Obese';
    
    return `${bmi.toFixed(1)} (${interpretation})`;
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
  
  // Get icon for metric trend
  const getTrendIcon = (metricType, value) => {
    if (!value) return null;
    
    switch (metricType) {
      case 'BMI':
        if (value < 18.5 || value >= 25) 
          return <AlertTriangle size={14} className="ml-1" />;
        return <TrendingUp size={14} className="ml-1" />;
      case 'BP':
        const systolic = value.systolic;
        const diastolic = value.diastolic;
        if (!systolic || !diastolic) return null;
        if (systolic >= 130 || diastolic >= 80) 
          return <TrendingUp size={14} className="ml-1" />;
        return <TrendingDown size={14} className="ml-1" />;
      case 'GLUCOSE':
        if (value >= 100 || value < 70) 
          return <AlertTriangle size={14} className="ml-1" />;
        return <TrendingDown size={14} className="ml-1" />;
      default:
        return null;
    }
  };
  
  let severityColor, severityGradient;
  if (severity === 'Severe') {
    severityColor = colors.danger;
    severityGradient = isDarkMode ? 
      `linear-gradient(to right, ${colors.danger}30, ${colors.danger}20)` : 
      `linear-gradient(to right, ${colors.danger}20, ${colors.danger}10)`;
  } else if (severity === 'Moderate') {
    severityColor = colors.warning;
    severityGradient = isDarkMode ? 
      `linear-gradient(to right, ${colors.warning}30, ${colors.warning}20)` : 
      `linear-gradient(to right, ${colors.warning}20, ${colors.warning}10)`;
  } else {
    severityColor = colors.success;
    severityGradient = isDarkMode ? 
      `linear-gradient(to right, ${colors.success}30, ${colors.success}20)` : 
      `linear-gradient(to right, ${colors.success}20, ${colors.success}10)`;
  }

  return (
    <div 
      className={`p-4 rounded-2xl shadow-lg border transform hover:scale-102 transition-all duration-500 hover:shadow-xl dark-mode-transition ${expanded ? 'scale-102' : ''}`}
      style={{ 
        backgroundColor: isDarkMode ? colors.cardBg : 'white',
        borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
        boxShadow: expanded 
          ? `0 15px 20px -5px ${colors.primary}30` 
          : `0 10px 15px -3px ${colors.primary}20`
      }}
    >
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center shimmer" 
             style={{ 
               background: `linear-gradient(135deg, ${colors.accentAlt}90, ${colors.accentAlt})`
             }}>
          {getSymptomIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{symptom}</h4>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" style={{ color: colors.textSecondary }} />
            <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{time}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:shadow-sm mb-1" 
                style={{ background: severityGradient, color: severityColor }}>
            {severity}
          </span>
          <button 
            className="text-xs flex items-center transition-colors duration-300"
            style={{ color: colors.primary }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                Less detail
                <ChevronUp size={12} className="ml-1" />
              </>
            ) : (
              <>
                More detail
                <ChevronDown size={12} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Basic note - always visible */}
      {note && (
        <div className="mt-2 mb-1">
          <p className="text-xs p-2 rounded-lg transition-all duration-300 dark-mode-transition" 
            style={{ 
              color: colors.textPrimary, 
              backgroundColor: isDarkMode ? `${colors.primary}15` : '#F8FAFC',
            }}>
            {note}
          </p>
        </div>
      )}
      
      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 animate-fade-in">
          {/* Health context from Google Fit */}
          {healthContext && (
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 flex items-center dark-mode-transition" style={{ color: colors.textSecondary }}>
                <BarChart2 size={14} className="mr-1" />
                Health Metrics at Time of Symptom
              </h5>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Blood Pressure */}
                <div className="p-2 rounded-lg dark-mode-transition"
                    style={{ 
                      backgroundColor: isDarkMode ? `${colors.primary}15` : '#F8FAFC',
                    }}>
                  <div className="text-xs mb-1 dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Blood Pressure
                  </div>
                  <div className="flex items-center">
                    <div className="font-medium text-xs" style={{ 
                      color: getMetricColor('BP', healthContext.bloodPressure)
                    }}>
                      {formatBloodPressure(healthContext.bloodPressure)}
                    </div>
                    <span style={{ color: getMetricColor('BP', healthContext.bloodPressure) }}>
                      {getTrendIcon('BP', healthContext.bloodPressure)}
                    </span>
                  </div>
                </div>
                
                {/* BMI */}
                {healthContext.bmi && (
                  <div className="p-2 rounded-lg dark-mode-transition"
                      style={{ 
                        backgroundColor: isDarkMode ? `${colors.primary}15` : '#F8FAFC',
                      }}>
                    <div className="text-xs mb-1 dark-mode-transition" style={{ color: colors.textSecondary }}>
                      BMI
                    </div>
                    <div className="flex items-center">
                      <div className="font-medium text-xs" style={{ 
                        color: getMetricColor('BMI', healthContext.bmi)
                      }}>
                        {formatBMI(healthContext.bmi)}
                      </div>
                      <span style={{ color: getMetricColor('BMI', healthContext.bmi) }}>
                        {getTrendIcon('BMI', healthContext.bmi)}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Glucose */}
                {healthContext.glucose && (
                  <div className="p-2 rounded-lg dark-mode-transition"
                      style={{ 
                        backgroundColor: isDarkMode ? `${colors.primary}15` : '#F8FAFC',
                      }}>
                    <div className="text-xs mb-1 dark-mode-transition" style={{ color: colors.textSecondary }}>
                      Glucose
                    </div>
                    <div className="flex items-center">
                      <div className="font-medium text-xs" style={{ 
                        color: getMetricColor('GLUCOSE', healthContext.glucose)
                      }}>
                        {formatGlucose(healthContext.glucose)}
                      </div>
                      <span style={{ color: getMetricColor('GLUCOSE', healthContext.glucose) }}>
                        {getTrendIcon('GLUCOSE', healthContext.glucose)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Triggers section */}
          {triggers && triggers.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium mb-1 flex items-center dark-mode-transition" style={{ color: colors.textSecondary }}>
                <Tag size={12} className="mr-1" />
                Possible Triggers
              </h5>
              <div className="flex flex-wrap gap-1 ml-1">
                {triggers.map((trigger, idx) => (
                  <span 
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-full dark-mode-transition"
                    style={{ 
                      backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10`,
                      color: colors.primary
                    }}
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Associated symptoms section */}
          {associatedSymptoms && associatedSymptoms.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium mb-1 flex items-center dark-mode-transition" style={{ color: colors.textSecondary }}>
                <Heart size={12} className="mr-1" />
                Associated Symptoms
              </h5>
              <div className="flex flex-wrap gap-1 ml-1">
                {associatedSymptoms.map((assocSymptom, idx) => (
                  <span 
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-full dark-mode-transition"
                    style={{ 
                      backgroundColor: isDarkMode ? `${colors.accent}20` : `${colors.accent}10`,
                      color: colors.accent
                    }}
                  >
                    {assocSymptom}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* AI suggestion if available */}
          <div className="p-2 rounded-lg border-l-2 text-xs dark-mode-transition" 
               style={{ 
                 borderColor: colors.gradientAlt1,
                 backgroundColor: isDarkMode ? `${colors.gradientAlt1}10` : `${colors.gradientAlt1}05`
               }}>
            <div className="flex items-center mb-1">
              <Activity size={12} className="mr-1" style={{ color: colors.gradientAlt1 }} />
              <span className="font-medium" style={{ color: colors.gradientAlt1 }}>AI Insight</span>
            </div>
            <p style={{ color: colors.textSecondary }}>
              {healthContext && healthContext.bloodPressure && healthContext.bloodPressure.systolic >= 130 && symptom?.toLowerCase().includes('headache')
                ? "This headache coincided with elevated blood pressure. Consider monitoring your blood pressure more regularly and discuss with your doctor."
                : symptom?.toLowerCase().includes('headache') 
                ? "Track water intake and screen time to identify patterns with your headaches."
                : symptom?.toLowerCase().includes('nausea')
                ? "Consider logging meals to identify potential food triggers."
                : "Log this symptom regularly to help AI detect patterns."}
            </p>
          </div>
        </div>
      )}
      
      {/* Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SymptomCard;