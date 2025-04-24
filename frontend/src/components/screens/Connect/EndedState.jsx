import React from 'react';
import { Phone } from 'lucide-react';

const EndedState = ({ errorMessage, callDuration, formatTime, colors, isDarkMode }) => {
  const endedBgColor = isDarkMode ? colors.darkBg : 'black';
  
  return (
    <div className="h-full flex flex-col items-center justify-center dark-mode-transition"
         style={{ backgroundColor: endedBgColor }}>
      <div className="w-20 h-20 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center mb-6">
        <Phone size={32} className="text-red-500 transform rotate-135" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {errorMessage || 'Call Ended'}
      </h3>
      {!errorMessage && (
        <p className="text-white text-opacity-70">Duration: {formatTime(callDuration)}</p>
      )}
    </div>
  );
};

export default EndedState;