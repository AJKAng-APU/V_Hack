import React from 'react';
import { useTheme } from '../ThemeContext';

// Action Button with enhanced hover and animations - with dark mode support
const ActionButton = ({ label, icon, gradient, onClick }) => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center p-4 rounded-2xl shadow-lg transform hover:scale-110 transition-all duration-500 hover:shadow-xl dark-mode-transition"
      style={{ 
        backgroundColor: isDarkMode ? colors.cardBg : 'white',
        boxShadow: `0 15px 25px -5px ${colors.primary}20`,
        borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
      }}
    >
      <div className="w-14 h-14 rounded-xl mb-3 flex items-center justify-center shadow-md shimmer" 
           style={{ 
             background: gradient,
             transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
             boxShadow: isDarkMode ? `0 8px 15px -3px ${colors.primary}30` : '0 8px 15px -3px rgba(0,0,0,0.2)'
           }}>
        <div style={{ color: 'white', transition: 'transform 0.3s ease-in-out' }}>{icon}</div>
      </div>
      <span className="text-xs font-medium text-center transition-all duration-300 dark-mode-transition" 
            style={{ color: colors.textPrimary }}>
        {label}
      </span>
    </button>
  );
};

export default ActionButton;