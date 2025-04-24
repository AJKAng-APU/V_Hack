import React from 'react';
import { useTheme } from '../ThemeContext';

const CategoryButton = ({ label, icon, gradient }) => {
    const { isDarkMode, colors } = useTheme();
    
    return (
      <button className="p-4 rounded-2xl shadow-lg flex items-center transform hover:scale-105 transition-all duration-500 hover:shadow-xl dark-mode-transition"
             style={{ 
               backgroundColor: isDarkMode ? colors.cardBg : 'white',
               boxShadow: `0 10px 15px -3px ${colors.primary}20`,
               borderColor: isDarkMode ? `${colors.primary}30` : 'transparent',
               border: isDarkMode ? '1px solid' : 'none'
             }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shimmer transition-transform hover:scale-110 duration-300" 
             style={{ 
               background: gradient,
               boxShadow: isDarkMode ? `0 8px 15px -3px ${colors.primary}30` : '0 8px 15px -3px rgba(0,0,0,0.2)'
             }}>
          <div style={{ color: 'white' }}>{icon}</div>
        </div>
        <span className="text-sm font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{label}</span>
      </button>
    );
  };

export default CategoryButton;