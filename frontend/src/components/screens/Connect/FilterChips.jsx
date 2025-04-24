import React from 'react';
import { Clock } from 'lucide-react';

const FilterChips = ({ headerVisible, filterActive, setFilterActive, colors, isDarkMode }) => {
  return (
    <div className={`flex space-x-2 mb-6 transition-all duration-500 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
      <button 
        className="px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 flex items-center dark-mode-transition"
        style={{
          backgroundColor: filterActive 
            ? colors.primary 
            : isDarkMode ? `${colors.primary}20` : `${colors.primary}10`,
          color: filterActive ? 'white' : colors.primary,
          boxShadow: filterActive ? `0 8px 15px -3px ${colors.primary}40` : 'none'
        }}
        onClick={() => setFilterActive(!filterActive)}
      >
        <Clock size={14} className="mr-1" />
        Available now
      </button>
      <button className="px-4 py-2 rounded-full text-xs font-medium dark-mode-transition" 
        style={{ 
          backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10`, 
          color: colors.primary 
        }}>
        Primary Care
      </button>
      <button className="px-4 py-2 rounded-full text-xs font-medium dark-mode-transition" 
        style={{ 
          backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10`, 
          color: colors.primary 
        }}>
        Specialists
      </button>
    </div>
  );
};

export default FilterChips;