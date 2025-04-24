import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import useGlobalCallStore from '../services/GlobalCallService';

/**
 * Shows a small indicator when doctors are available
 */
const DoctorAvailabilityIndicator = () => {
  const { colors, isDarkMode } = useTheme();
  const { availableDoctors, loadingDoctors, loadAvailableDoctors } = useGlobalCallStore();
  const [isVisible, setIsVisible] = useState(false);
  
  // Effect to handle visibility of the indicator
  useEffect(() => {
    // Only show the indicator when we have doctors available
    if (availableDoctors.length > 0 && !loadingDoctors) {
      setIsVisible(true);
      
      // Hide the indicator after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [availableDoctors, loadingDoctors]);
  
  // Load doctors on mount and periodically refresh
  useEffect(() => {
    loadAvailableDoctors();
    
    const interval = setInterval(() => {
      loadAvailableDoctors();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [loadAvailableDoctors]);
  
  // Don't render anything if no doctors or not visible
  if (!isVisible || availableDoctors.length === 0) {
    return null;
  }
  
  return (
    <div 
      className={`fixed top-8 right-4 z-40 py-1 px-3 rounded-full flex items-center shadow-md transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
      style={{ 
        backgroundColor: isDarkMode ? colors.cardBg : 'white',
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1)`
      }}
    >
      <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: colors.success }}></div>
      <span className="text-xs mr-1" style={{ color: colors.textPrimary }}>
        {availableDoctors.length} {availableDoctors.length === 1 ? 'doctor' : 'doctors'} available
      </span>
      <Users size={12} style={{ color: colors.primary }} />
    </div>
  );
};

export default DoctorAvailabilityIndicator;