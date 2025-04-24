import React from 'react';
import { MoreVertical } from 'lucide-react';

const CallHeader = ({ doctor, callDuration, formatTime, showControls }) => {
  return (
    <div className={`absolute top-0 left-0 right-0 p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">{doctor?.name || 'Dr. Johnson'}</h3>
          <p className="text-sm text-white text-opacity-70">{formatTime(callDuration)}</p>
        </div>
        <div className="flex items-center">
          <div className="px-3 py-1 rounded-full bg-black bg-opacity-30 text-white text-sm mr-2">
            HD
          </div>
          <div className="w-8 h-8 rounded-full bg-black bg-opacity-30 flex items-center justify-center">
            <MoreVertical size={16} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallHeader;