import React from 'react';

// Action Button with enhanced hover and animations
const ActionButton = ({ label, icon, gradient, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center p-4 rounded-2xl bg-white shadow-lg transform hover:scale-110 transition-all duration-500 hover:shadow-xl"
      style={{ boxShadow: `0 15px 25px -5px rgba(0,0,0,0.1)` }}
    >
      <div className="w-14 h-14 rounded-xl mb-3 flex items-center justify-center shadow-md shimmer" 
           style={{ 
             background: gradient,
             transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
             boxShadow: '0 8px 15px -3px rgba(0,0,0,0.2)'
           }}>
        <div style={{ color: 'white', transition: 'transform 0.3s ease-in-out' }}>{icon}</div>
      </div>
      <span className="text-xs font-medium text-center transition-all duration-300">{label}</span>
    </button>
  );
};

export default ActionButton;