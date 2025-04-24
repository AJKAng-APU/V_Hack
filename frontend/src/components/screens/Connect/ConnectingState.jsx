import React from 'react';

const ConnectionStatus = ({ connectionQuality, showControls }) => {
  // Determine background color based on connection quality
  const getBgColor = () => {
    if (connectionQuality === 'good') return 'rgba(0, 200, 0, 0.6)';
    if (connectionQuality === 'poor') return 'rgba(255, 180, 0, 0.6)';
    return 'rgba(255, 0, 0, 0.6)'; // unstable
  };
  
  // Always show at least a minimal indicator when connection is not good
  const shouldAlwaysShow = connectionQuality !== 'good';
  
  return (
    <div 
      className={`absolute top-4 right-4 px-2 py-1 rounded-full transition-all duration-300 ${
        showControls ? 'opacity-100 scale-100' : shouldAlwaysShow ? 'opacity-70 scale-75' : 'opacity-0'
      }`}
      style={{ 
        backgroundColor: getBgColor(),
        backdropFilter: 'blur(4px)',
        transform: `${showControls ? 'translateY(0)' : shouldAlwaysShow ? 'translateY(8px)' : 'translateY(0)'}`,
        transformOrigin: 'top right'
      }}
    >
      <div className="flex items-center">
        <div className="flex space-x-1 mr-1">
          <div className="w-1 h-3 rounded-sm bg-white" style={{ 
            opacity: connectionQuality === 'unstable' ? 0.4 : 1
          }}></div>
          <div className="w-1 h-4 rounded-sm bg-white" style={{ 
            opacity: connectionQuality === 'poor' || connectionQuality === 'unstable' ? 0.4 : 1 
          }}></div>
          <div className="w-1 h-5 rounded-sm bg-white" style={{ 
            opacity: connectionQuality !== 'good' ? 0.4 : 1 
          }}></div>
        </div>
        <span className="text-xs text-white font-medium ml-1">
          {connectionQuality === 'good' ? 'Good' : 
           connectionQuality === 'poor' ? 'Poor' : 'Unstable'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;