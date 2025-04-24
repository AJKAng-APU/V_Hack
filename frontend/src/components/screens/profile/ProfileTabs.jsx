import React from 'react';

const ProfileTabs = ({ activeTab, setActiveTab, hoveredTab, setHoveredTab, colors }) => {
  const tabs = [
    {
      id: 'account', 
      label: 'Account', 
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    {
      id: 'health', 
      label: 'Health', 
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
    },
    {
      id: 'preferences', 
      label: 'Settings', 
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    },
    {
      id: 'privacy', 
      label: 'Privacy', 
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    }
  ];

  return (
    <div className="mb-8 flex p-1 rounded-xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-md dark-mode-transition">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          onMouseEnter={() => setHoveredTab(tab.id)}
          onMouseLeave={() => setHoveredTab(null)}
          className={`flex-1 py-3 text-sm font-medium transition-all duration-500 relative rounded-lg ${
            activeTab === tab.id 
              ? 'text-white bg-gradient-to-br from-blue-600/80 to-blue-800/80 shadow-lg' 
              : 'text-blue-300 hover:text-white'
          }`}
          style={{
            transform: activeTab === tab.id ? 'translateY(-2px)' : 'none',
            boxShadow: activeTab === tab.id ? `0 10px 15px -3px ${colors.primary}40` : 'none'
          }}
        >
          <div className="flex flex-col items-center">
            <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path>
            </svg>
            <span>{tab.label}</span>
          </div>
          {activeTab === tab.id && (
            <div className="absolute inset-0 rounded-lg opacity-60 blur-sm -z-10 dark-mode-transition"
                 style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})` }}></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default ProfileTabs;