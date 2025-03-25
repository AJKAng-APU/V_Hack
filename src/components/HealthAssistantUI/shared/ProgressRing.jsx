import React from 'react';

// Progress Ring with enhanced animations and hover effects
const ProgressRing = ({ value, label, icon, color, colors }) => {
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  // Default text color if colors prop is missing
  const textSecondaryColor = colors?.textSecondary || "#64748B";
  
  return (
    <div className="flex flex-col items-center transform hover:scale-110 transition-all duration-500">
      <div className="relative mb-2">
        <svg className="transform -rotate-90 w-16 h-16">
          <circle
            cx="32"
            cy="32"
            r="16"
            stroke="#E5E7EB"
            strokeWidth="3"
            fill="transparent"
          />
          <circle
            cx="32"
            cy="32"
            r="16"
            stroke={color}
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center" 
               style={{ 
                 color,
                 boxShadow: `0 0 10px ${color}30`,
                 transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out'
               }}>
            {icon}
          </div>
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color }}>{value}%</span>
      <span className="text-xs" style={{ color: textSecondaryColor }}>{label}</span>
    </div>
  );
};

export default ProgressRing;