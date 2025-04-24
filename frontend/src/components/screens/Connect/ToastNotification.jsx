import React, { useEffect, useState } from 'react';

const ToastNotification = ({ activeToast, colors, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Use effect to handle animation states when activeToast changes
  useEffect(() => {
    if (activeToast) {
      // Show the toast immediately when a new toast arrives
      setIsVisible(true);
      
      // Hide the toast after the timeout
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // 3 seconds visibility before starting to fade out
      
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  return (
    <div 
      className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 rounded-xl px-4 py-3 shadow-lg transition-all duration-300 z-50 dark-mode-transition ${
        activeToast && isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
      style={{ 
        maxWidth: '90%',
        backgroundColor: isDarkMode ? colors.cardBg : 'white',
        boxShadow: `0 15px 30px -5px ${colors.primary}30`
      }}
    >
      <div className="text-sm font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
        {activeToast}
      </div>
    </div>
  );
};

export default ToastNotification;