import React from 'react';
import MessageCard from './MessageCard';
import { useTheme } from '../../ThemeContext';

const RecentMessages = ({ headerVisible, colors }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`transition-all duration-500 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '500ms' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>Recent Messages</h3>
        <button className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md dark-mode-transition" 
                style={{ 
                  color: colors.primary, 
                  backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10` 
                }}>
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        <MessageCard
          doctor="Dr. Johnson"
          message="Your latest blood pressure readings look good. Keep up the good work with the diet modifications we discussed!"
          time="Today, 10:23 AM"
          unread={true}
          colors={colors}
        />
        <MessageCard
          doctor="Dr. Smith"
          message="I've adjusted your medication schedule based on your recent feedback. Please review the changes in your medication section."
          time="Yesterday, 4:15 PM"
          unread={false}
          colors={colors}
        />
        <MessageCard
          doctor="Nurse Williams"
          message="How are you feeling after the new medication? Any side effects to report?"
          time="Mar 20, 9:30 AM"
          unread={false}
          colors={colors}
        />
      </div>
    </div>
  );
};

export default RecentMessages;