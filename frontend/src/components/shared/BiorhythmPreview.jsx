import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ArrowRight, 
  Activity,
  Zap, 
  Coffee, 
  Utensils,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../ThemeContext';

// This would use your actual biorhythm engine imports
import { biorhythmEngine, getSassyRecommendation } from '../services/BiorhythmEngine';

const BiorhythmPreview = ({ colors, setActiveScreen }) => {
  // State management
  const [bioData, setBioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const { isDarkMode } = useTheme();
  
  // Get current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Mock biorhythm engine for demonstration - replace with real engine integration
  const mockBiorhythmEngine = {
    getRecommendations: () => ({
      currentScore: {
        overall: 78,
        physical: 65,
        emotional: 82,
        intellectual: 72,
        metabolic: 85
      },
      dominantRhythm: {
        type: 'metabolic',
        value: 85
      },
      nextTransition: {
        from: 'metabolic',
        to: 'emotional',
        hoursFromNow: 3
      },
      hourlyData: Array(24).fill().map((_, i) => ({
        hour: i,
        overall: 0.3 + 0.4 * Math.sin((i + 8) / 3)
      })),
      recommendations: {
        medicationTiming: [8, 9, 19, 20],
        exerciseTiming: [11, 12, 13, 17, 18],
        mealTiming: [7, 8, 12, 13, 18, 19],
        focusTiming: [9, 10, 11, 14, 15, 16],
        sleepTiming: [22, 23, 0, 1, 2, 3, 4, 5]
      }
    })
  };
  
  // Load biorhythm data
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Replace with actual engine when integrating
        const data = mockBiorhythmEngine.getRecommendations();
        setBioData(data);
      } catch (error) {
        console.error("Failed to load biorhythm data:", error);
      } finally {
        setIsLoading(false);
      }
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);

  // Get biorhythm wave points for the chart
  const getBiorhythmPoints = () => {
    if (!bioData) {
      // Fallback wave pattern
      return Array(24).fill().map((_, i) => 0.3 + 0.4 * Math.sin((i + 8) / 3));
    }
    
    return bioData.hourlyData.map(data => data.overall);
  };
  
  // Get the dominant rhythm with icon and color
  const getDominantRhythm = () => {
    if (!bioData) return {
      type: 'metabolic',
      name: 'Metabolic',
      icon: <Utensils size={20} color="white" />,
      color: '#ED8936', // Amber/orange color for metabolic
      value: 85,
      description: "Metabolism in overdrive. Finally, a scientific excuse to eat that donut."
    };
    
    const type = bioData.dominantRhythm.type;
    const value = bioData.currentScore[type];
    
    const rhythmInfo = {
      physical: {
        name: 'Physical',
        icon: <Activity size={20} color="white" />,
        color: '#48BB78', // Green
        description: "Your physical energy is peaking. Get moving before your body realizes what's happening."
      },
      emotional: {
        name: 'Emotional',
        icon: <Zap size={20} color="white" />,
        color: '#805AD5', // Purple
        description: "Emotional intelligence at max capacity. Perfect for deep talks or dramatic social media posts."
      },
      intellectual: {
        name: 'Mental',
        icon: <Coffee size={20} color="white" />,
        color: '#4299E1', // Blue
        description: "Brain firing on all cylinders. Quick, solve that problem before it wears off."
      },
      metabolic: {
        name: 'Metabolic',
        icon: <Utensils size={20} color="white" />,
        color: '#ED8936', // Amber/orange
        description: "Metabolism in overdrive. Finally, a scientific excuse to eat that donut."
      }
    };
    
    return {
      type,
      value,
      ...rhythmInfo[type]
    };
  };

  // Get next optimal times for activities
  const getOptimalActivityTimes = () => {
    if (!bioData) {
      return [
        {
          name: "Exercise",
          icon: <Activity size={16} color="#48BB78" />,
          color: "#48BB78",
          label: "Ideal workout time",
          next: 5,
          nextUnit: "PM"
        },
        {
          name: "Focus",
          icon: <Coffee size={16} color="#4299E1" />,
          color: "#4299E1",
          label: "Peak concentration",
          next: 2,
          nextUnit: "PM"
        },
        {
          name: "Eat",
          icon: <Utensils size={16} color="#ED8936" />,
          color: "#ED8936",
          label: "Optimal metabolism",
          next: 6,
          nextUnit: "PM"
        }
      ];
    }
    
    // You would derive this from bioData.recommendations in a real implementation
    return [
      {
        name: "Exercise",
        icon: <Activity size={16} color="#48BB78" />,
        color: "#48BB78",
        label: "Ideal workout time",
        next: 5,
        nextUnit: "PM"
      },
      {
        name: "Focus",
        icon: <Coffee size={16} color="#4299E1" />,
        color: "#4299E1",
        label: "Peak concentration",
        next: 2,
        nextUnit: "PM"
      },
      {
        name: "Eat",
        icon: <Utensils size={16} color="#ED8936" />,
        color: "#ED8936",
        label: "Optimal metabolism",
        next: 6,
        nextUnit: "PM"
      }
    ];
  };
  
  const wavePoints = getBiorhythmPoints();
  const dominantRhythm = getDominantRhythm();
  const activityTimes = getOptimalActivityTimes();
  
  // Format time as HH:MM
  const formatTime = (hours, minutes) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Navigation handler - proper navigation to biorhythm screen
  const handleViewBiorhythm = () => {
    setActiveScreen('biorhythm');
  };
  
  // Dark mode specific colors
  const bgColor = isDarkMode ? colors.cardBg : 'white';
  const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  const chartLineColor = isDarkMode ? '#3B82F6' : '#3B82F6';
  const chartBgColor = isDarkMode ? `${colors.primary}30` : '#E0E7FF';
  const activityBgColor = isDarkMode ? `${colors.primary}15` : '#F9FAFB';
  const progressCircleBg = isDarkMode ? `${colors.primary}30` : "#E2E8F0";
  const bioStateCardBg = isDarkMode ? colors.darkBg : "#FFF5F5";
  
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg transform hover:scale-102 transition-all duration-500 dark-mode-transition"
         style={{ 
           backgroundColor: bgColor, 
           boxShadow: `0 15px 25px -5px ${colors.primary}30`
         }}>
      {/* Header section */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>Biorhythm Now</h3>
          <div className="flex items-center">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-500 text-sm mr-3 flex items-center dark-mode-transition"
              style={{ color: colors.primary }}
            >
              {isExpanded ? 
                <>Less <ChevronUp size={16} className="ml-1" /></> : 
                <>More <ChevronDown size={16} className="ml-1" /></>
              }
            </button>
            <button 
              onClick={handleViewBiorhythm}
              className="text-blue-600 text-sm flex items-center dark-mode-transition"
              style={{ color: colors.primary }}
            >
              Details
              <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
          <Clock size={14} className="mr-1" />
          <span>{formatTime(currentHour, currentMinutes)}</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-6 flex justify-center items-center">
          <div className="animate-pulse w-full h-40 rounded-xl dark-mode-transition" 
               style={{ backgroundColor: isDarkMode ? `${colors.primary}20` : '#F3F4F6' }}></div>
        </div>
      ) : (
        <>
          {/* Biorhythm visualization */}
          <div className="px-6 py-2">
            <div className="relative h-16 mb-2">
              {wavePoints.map((point, i) => {
                const isCurrent = i === currentHour;
                const height = `${Math.max(20, point * 100)}%`;
                
                return (
                  <div 
                    key={i} 
                    className="absolute bottom-0 rounded-t-sm dark-mode-transition"
                    style={{ 
                      height,
                      width: '3px',
                      left: `${(i / 24) * 100}%`,
                      backgroundColor: isCurrent ? chartLineColor : chartBgColor,
                      opacity: isCurrent ? 1 : 0.7
                    }}>
                    {isCurrent && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <div className="px-2.5 py-1 rounded-full text-xs bg-blue-500 text-white font-medium shimmer">
                          Now
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
              <span>12</span>
              <span>6</span>
              <span>12</span>
              <span>6</span>
              <span>12</span>
            </div>
          </div>
          
          {/* Current state card */}
          <div className="px-6 pb-4">
            <div 
              className="rounded-xl p-5 relative overflow-hidden transform hover:scale-105 transition-all duration-300 dark-mode-transition"
              style={{
                backgroundColor: bioStateCardBg,
                borderLeftWidth: "4px",
                borderLeftColor: dominantRhythm.color
              }}
            >
              <div className="flex">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mr-4 shimmer"
                  style={{ backgroundColor: dominantRhythm.color }}
                >
                  {dominantRhythm.icon}
                </div>
                
                <div>
                  <div className="flex items-center">
                    <h4 className="text-lg font-bold mr-2" style={{ color: dominantRhythm.color }}>
                      {dominantRhythm.name} Peak
                    </h4>
                    <div 
                      className="text-sm font-bold"
                      style={{ color: dominantRhythm.color }}
                    >
                      {dominantRhythm.value}%
                    </div>
                  </div>
                  
                  <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                    {dominantRhythm.description}
                  </p>
                  
                  <div className="mt-2 text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Next shift: {bioData?.nextTransition?.hoursFromNow || 3}h to {bioData?.nextTransition?.to || 'emotional'} peak
                  </div>
                </div>
              </div>
            </div>

            {isExpanded && (
              <>
                {/* Activity recommendations */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {activityTimes.map((activity, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-lg transform hover:scale-110 transition-all duration-300 dark-mode-transition"
                      onClick={handleViewBiorhythm}
                      style={{ backgroundColor: activityBgColor }}
                    >
                      <div 
                        className="flex flex-col items-center"
                      >
                        <div className="mb-1">
                          {activity.icon}
                        </div>
                        <div className="text-xs text-center font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                          {activity.name}
                        </div>
                        <div className="text-xs text-center dark-mode-transition" style={{ color: colors.textSecondary }}>
                          {activity.label}
                        </div>
                        <div className="mt-1 text-xs font-medium" style={{ color: activity.color }}>
                          Next: {activity.next} {activity.nextUnit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Biorhythm meters */}
                <div className="flex justify-between mt-5 mb-2">
                  <div className="flex flex-col items-center">
                    <div className="relative h-10 w-10 mb-1">
                      <svg viewBox="0 0 36 36" className="h-10 w-10">
                        <circle cx="18" cy="18" r="16" fill="none" 
                                stroke={progressCircleBg} 
                                strokeWidth="2"></circle>
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          stroke="#48BB78" 
                          strokeWidth="2"
                          strokeDasharray={`${65 * 0.01 * 100} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        ></circle>
                        <text x="18" y="18" textAnchor="middle" dy=".3em" className="text-xs font-medium fill-current text-green-500">
                          <Activity size={14} />
                        </text>
                      </svg>
                    </div>
                    <div className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>Physical</div>
                    <div className="text-xs font-medium text-green-500">65%</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="relative h-10 w-10 mb-1">
                      <svg viewBox="0 0 36 36" className="h-10 w-10">
                        <circle cx="18" cy="18" r="16" fill="none" 
                                stroke={progressCircleBg} 
                                strokeWidth="2"></circle>
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          stroke="#805AD5" 
                          strokeWidth="2"
                          strokeDasharray={`${82 * 0.01 * 100} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        ></circle>
                        <text x="18" y="18" textAnchor="middle" dy=".3em" className="text-xs font-medium fill-current text-purple-500">
                          <Zap size={14} />
                        </text>
                      </svg>
                    </div>
                    <div className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>Emotional</div>
                    <div className="text-xs font-medium text-purple-500">82%</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="relative h-10 w-10 mb-1">
                      <svg viewBox="0 0 36 36" className="h-10 w-10">
                        <circle cx="18" cy="18" r="16" fill="none" 
                                stroke={progressCircleBg} 
                                strokeWidth="2"></circle>
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          stroke="#4299E1" 
                          strokeWidth="2"
                          strokeDasharray={`${72 * 0.01 * 100} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        ></circle>
                        <text x="18" y="18" textAnchor="middle" dy=".3em" className="text-xs font-medium fill-current text-blue-500">
                          <Coffee size={14} />
                        </text>
                      </svg>
                    </div>
                    <div className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>Mental</div>
                    <div className="text-xs font-medium text-blue-500">72%</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="relative h-10 w-10 mb-1">
                      <svg viewBox="0 0 36 36" className="h-10 w-10">
                        <circle cx="18" cy="18" r="16" fill="none" 
                                stroke={progressCircleBg} 
                                strokeWidth="2"></circle>
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          stroke="#ED8936" 
                          strokeWidth="2"
                          strokeDasharray={`${85 * 0.01 * 100} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        ></circle>
                        <text x="18" y="18" textAnchor="middle" dy=".3em" className="text-xs font-medium fill-current text-orange-500">
                          <Utensils size={14} />
                        </text>
                      </svg>
                    </div>
                    <div className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>Metabolic</div>
                    <div className="text-xs font-medium text-orange-500">85%</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
      
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

export default BiorhythmPreview;