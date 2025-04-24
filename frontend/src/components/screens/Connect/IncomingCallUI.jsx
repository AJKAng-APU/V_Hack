import React from 'react';
import { Phone } from 'lucide-react';

const IncomingCallUI = ({ incomingCallInfo, colors, acceptIncomingCall, rejectIncomingCall }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full mx-4 animate-bounce-in">
        <div className="p-6 text-center">
          <div className="w-28 h-28 rounded-full mx-auto mb-4 relative overflow-hidden border-4 animate-pulse" 
              style={{ borderColor: colors.primary }}>
            <img 
              src={incomingCallInfo.doctor.image} 
              alt={incomingCallInfo.doctor.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-black bg-opacity-20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-white border-opacity-60 border-t-transparent animate-spin"></div>
              </div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-2 dark:text-white">{incomingCallInfo.doctor.name}</h3>
          <p className="text-md text-gray-500 dark:text-gray-300 mb-6 animate-pulse">Incoming video call...</p>
          
          <div className="flex justify-center space-x-6">
            <button 
              className="w-18 h-18 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110"
              style={{ backgroundColor: colors.danger }}
              onClick={rejectIncomingCall}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-600">
                <Phone size={30} className="text-white transform rotate-135" />
              </div>
            </button>
            
            <button 
              className="w-18 h-18 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110"
              style={{ backgroundColor: colors.success }}
              onClick={() => acceptIncomingCall(incomingCallInfo.doctor)}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-600 animate-pulse">
                <Phone size={30} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallUI;