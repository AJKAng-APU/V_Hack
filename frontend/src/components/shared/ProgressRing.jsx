import React from 'react';
import { useTheme } from '../ThemeContext';

// Progress Ring with enhanced animations and hover effects
const ProgressRing = ({ value, label, icon, color, colors }) => {
  const { isDarkMode } = useTheme();
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  // Adjust base circle color for dark mode
  const baseCircleColor = isDarkMode ? `${colors.primary}30` : '#E5E7EB';
  
  return (
    <div className="flex flex-col items-center transform hover:scale-110 transition-all duration-500">
      <div className="relative mb-2">
        <svg className="transform -rotate-90 w-16 h-16">
          <circle
            cx="32"
            cy="32"
            r="16"
            stroke={baseCircleColor}
            strokeWidth="3"
            fill="transparent"
            className="dark-mode-transition"
          />
          <circle
            cx="32"
            cy="32"
            r="16"
            stroke={color}
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center dark-mode-transition" 
               style={{ 
                 backgroundColor: isDarkMode ? colors.darkBg : 'white',
                 color,
                 boxShadow: isDarkMode ? `0 0 10px ${color}50` : `0 0 10px ${color}30`,
                 transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out'
               }}>
            {icon}
          </div>
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color }}>{value}%</span>
      <span className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{label}</span>
    </div>
  );
};

export default ProgressRing;