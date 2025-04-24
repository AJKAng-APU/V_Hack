import React, { createContext, useState, useContext, useEffect } from 'react';
import { colors } from './colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage if available
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('healthsync_darkmode');
    return savedTheme === 'true';
  });
  
  // Current theme colors based on mode
  const currentColors = isDarkMode ? colors.dark : colors.light;
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('healthsync_darkmode', isDarkMode);
    
    // Apply class to document body for global styling
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Apply color scheme meta tag for browser UI
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDarkMode ? colors.dark.background : colors.light.background);
    }
  }, [isDarkMode]);
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors: currentColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for consuming the theme context
export const useTheme = () => useContext(ThemeContext);