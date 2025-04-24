import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ 
  headerVisible, 
  searchFocused, 
  setSearchFocused, 
  searchQuery, 
  setSearchQuery, 
  handleSearch,
  colors,
  isDarkMode
}) => {
  return (
    <div className={`mb-6 transition-all duration-500 transform ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
      <div className="relative">
        <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300`}
             style={{ color: searchFocused ? colors.primary : colors.textSecondary }}>
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search doctors, messages..."
          className="w-full pl-12 pr-4 py-3 rounded-xl transition-all duration-300 dark-mode-transition"
          style={{
            backgroundColor: searchFocused 
              ? isDarkMode ? colors.cardBg : 'white' 
              : isDarkMode ? `${colors.primary}15` : `${colors.primary}05`,
            border: searchFocused 
              ? `2px solid ${colors.primary}30` 
              : isDarkMode ? `1px solid ${colors.primary}20` : `1px solid ${colors.primary}10`,
            boxShadow: searchFocused ? `0 10px 15px -3px ${colors.primary}20` : 'none',
            color: colors.textPrimary,
            outline: 'none',
          }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2"
            onClick={() => setSearchQuery('')}
            style={{ color: colors.textSecondary }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;