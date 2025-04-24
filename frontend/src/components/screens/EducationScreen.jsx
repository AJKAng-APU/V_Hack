import React from 'react';
import ArticleCard from '../shared/ArticleCard';
import CategoryButton from '../shared/CategoryButton';
import { Heart, Activity, Calendar, User, Clock } from "lucide-react";
import { useTheme } from '../ThemeContext';

const EducationScreen = ({ colors }) => {
    const { isDarkMode } = useTheme();
    
    // Dark mode specific styles
    const cardBg = isDarkMode ? colors.cardBg : 'white';
    const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
    const inputBg = isDarkMode ? `${colors.primary}15` : 'white';
    const inputFocusBg = isDarkMode ? `${colors.primary}25` : 'white';
    const searchIconBg = isDarkMode ? colors.darkBg : 'white';
    
    return (
      <div className="p-6 pb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">Health Education</h1>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>Personalized information for you</p>
          </div>
          <button className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform hover:scale-110 duration-300 dark-mode-transition"
                  style={{ 
                    backgroundColor: searchIconBg, 
                    boxShadow: isDarkMode ? `0 8px 15px -3px ${colors.primary}30` : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </header>
        
        {/* Recommended topics with enhanced card designs and animations */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Recommended For You</h3>
          <div className="space-y-4">
            <ArticleCard
              title="Managing Type 2 Diabetes"
              description="Learn lifestyle changes and medication tips to control your blood sugar."
              image="/api/placeholder/80/80"
              readTime="8 min read"
              colors={colors}
            />
            <ArticleCard
              title="Hypertension Diet Tips"
              description="Dietary approaches to reduce blood pressure naturally."
              image="/api/placeholder/80/80"
              readTime="5 min read"
              colors={colors}
            />
            <ArticleCard
              title="Understanding Cholesterol"
              description="How to interpret your cholesterol readings and what they mean."
              image="/api/placeholder/80/80"
              readTime="6 min read"
              colors={colors}
            />
          </div>
        </div>
        
        {/* Health categories with enhanced gradient backgrounds and hover effects */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Categories</h3>
          <div className="grid grid-cols-2 gap-4">
            <CategoryButton 
              label="Diabetes Management" 
              icon={<Activity size={22} />} 
              gradient={`linear-gradient(135deg, ${colors.primary}, ${colors.accent})`}
            />
            <CategoryButton 
              label="Heart Health" 
              icon={<Heart size={22} />} 
              gradient={`linear-gradient(135deg, ${colors.danger}, ${colors.gradientAlt2})`}
            />
            <CategoryButton 
              label="Medication Info" 
              icon={<Calendar size={22} />} 
              gradient={`linear-gradient(135deg, ${colors.accent}, ${colors.primary})`}
            />
            <CategoryButton 
              label="Lifestyle Tips" 
              icon={<User size={22} />} 
              gradient={`linear-gradient(135deg, ${colors.success}, ${colors.accent})`}
            />
          </div>
        </div>
        
        {/* Ask AI with enhanced gradient button and better styling */}
        <div>
          <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Ask Health AI</h3>
          <div className="p-5 rounded-2xl bg-white shadow-lg transform hover:scale-102 transition-all duration-500 dark-mode-transition"
               style={{ 
                 backgroundColor: cardBg,
                 boxShadow: `0 15px 25px -5px ${colors.primary}20` 
               }}>
            <p className="text-sm mb-4 dark-mode-transition" style={{ color: colors.textSecondary }}>
              Have a health question? Our AI can provide evidence-based information.
            </p>
            <div className="flex items-center">
              <input 
                type="text" 
                placeholder="Type your question..." 
                className="flex-1 p-3 border border-blue-100 rounded-xl mr-3 shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-300 dark-mode-transition"
                style={{ 
                  backgroundColor: inputBg,
                  borderColor: borderColor,
                  color: colors.textPrimary,
                  outlineColor: colors.primary,
                  '&:focus': { backgroundColor: inputFocusBg }
                }}
              />
              <button className="p-3 rounded-xl transition-transform hover:scale-110 duration-300" 
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                        boxShadow: `0 8px 15px -3px ${colors.primary}40`
                      }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div className="mt-4 p-3 rounded-xl animate-breathe dark-mode-transition" 
                 style={{ 
                   background: isDarkMode 
                    ? `linear-gradient(to right, ${colors.primary}30, ${colors.accent}20)` 
                    : `linear-gradient(to right, ${colors.primary}20, ${colors.accent}10)`
                 }}>
              <p className="text-sm font-medium flex items-center" style={{ color: colors.primary }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 shimmer dark-mode-transition" 
                     style={{ backgroundColor: isDarkMode ? `${colors.primary}30` : `${colors.primary}20` }}>
                  <Clock size={16} color={colors.primary} />
                </div>
                Recent: "How does stress affect blood pressure?"
              </p>
            </div>
          </div>
        </div>
        
        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes shimmer {
            0% { background-position: -100% 0; }
            100% { background-position: 200% 0; }
          }
          .shimmer {
            background: linear-gradient(90deg, 
              rgba(255,255,255,0) 0%, 
              rgba(255,255,255,0.2) 50%, 
              rgba(255,255,255,0) 100%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }
          
          .dark .shimmer {
            background: linear-gradient(90deg, 
              rgba(30,41,59,0) 0%, 
              rgba(30,41,59,0.3) 50%, 
              rgba(30,41,59,0) 100%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  };

export default EducationScreen;