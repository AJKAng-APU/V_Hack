import React from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import ToggleSwitch from '../components/ToggleSwitch';

const PrivacyTab = ({ preferences, handleToggle, colors }) => {
  return (
    <div className="space-y-8 animate-fadein">
      <div>
        <h3 className="font-bold text-lg mb-5 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
          Privacy Settings
        </h3>
        
        <div className="space-y-6">
          <ToggleSwitch 
            id="toggleDataSharing" 
            label="Data Sharing" 
            description="Share anonymous data to improve app experience" 
            value={preferences.dataSharing} 
            onChange={() => handleToggle('dataSharing')}
            colors={colors}
          />
          
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-blue-800/20 backdrop-blur-sm">
            <div className="flex">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <p className="ml-3 text-sm text-blue-200">
                Your data is encrypted and secured. We promise not to sell it to the highest bidder. (Unless they offer a REALLY good price. Kidding!)
              </p>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            {[
              { label: 'Privacy Policy', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', tooltip: 'Legal mumbo jumbo that nobody reads' },
              { label: 'Terms of Service', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', tooltip: 'The thing you agree to without reading' },
              { label: 'Data Request', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', tooltip: 'Find out what we know about you (spoiler: a lot)' }
            ].map((item, index) => (
              <button 
                key={index}
                className="w-full p-3 rounded-xl text-sm font-medium flex items-center justify-between hover:bg-white hover:bg-opacity-5 transition-all duration-300 group tooltip-container"
                style={{ color: 'white' }}
              >
                <span className="tooltip">{item.tooltip}</span>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300 group-hover:scale-110 shimmer"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(8, 145, 178, 0.2))',
                          backdropFilter: 'blur(5px)'
                        }}>
                    <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                    </svg>
                  </div>
                  <span className="text-blue-100">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-blue-300 transition-all duration-300 group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-lg mb-5 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          Danger Zone <span className="ml-2 text-sm font-normal text-red-300">(cue dramatic music)</span>
        </h3>
        
        <div className="space-y-3">
          {[
            { label: 'Delete All Health Data', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', tooltip: 'Because starting from scratch is sometimes easier' },
            { label: 'Delete Account', icon: 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6', tooltip: 'Going off the grid? We\'ll miss you (sort of)' }
          ].map((item, index) => (
            <button 
              key={index}
              className="w-full p-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-300 group bg-red-900 bg-opacity-20 hover:bg-opacity-30 tooltip-container"
            >
              <span className="tooltip">{item.tooltip}</span>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300 group-hover:scale-110 shimmer"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.2))',
                        backdropFilter: 'blur(5px)'
                      }}>
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                  </svg>
                </div>
                <span className="text-red-100">{item.label}</span>
              </div>
              <AlertTriangle size={16} className="text-red-300 animate-pulse" />
            </button>
          ))}
        </div>
        
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-md">
          <div className="flex">
            <div className="flex-shrink-0 pt-0.5">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="ml-3 text-sm text-red-200">
              Warning: These actions cannot be undone. Like that regrettable haircut in high school, but permanent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyTab;