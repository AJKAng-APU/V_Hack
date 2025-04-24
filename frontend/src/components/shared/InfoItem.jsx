import React from 'react';
import { useTheme } from '../ThemeContext';

const InfoItem = ({ label, value, colors }) => {
    const { isDarkMode } = useTheme();
    
    return (
      <div className="flex items-center p-2 rounded-lg transition-all duration-300 hover:bg-blue-50 dark-mode-transition" 
           style={{ 
             backgroundColor: isDarkMode ? `${colors.primary}15` : '#F8FAFC',
             '&:hover': {
               backgroundColor: isDarkMode ? `${colors.primary}25` : '#EFF6FF'
             }
           }}>
        <span className="text-sm font-medium w-24 dark-mode-transition" style={{ color: colors.textSecondary }}>{label}:</span>
        <span className="text-sm flex-1 font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{value}</span>
      </div>
    );
  };

export default InfoItem;