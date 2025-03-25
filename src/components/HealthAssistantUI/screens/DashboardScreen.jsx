import React from 'react';
import { 
  Activity, Calendar, MessageCircle, Heart, AlertTriangle, 
  Clock, Video, ChevronRight, CheckCircle, Trophy, ArrowUpRight, Zap, Bell
} from 'lucide-react';

// Import shared components
import ProgressRing from '../shared/ProgressRing';
import ActionButton from '../shared/ActionButton';

// Dashboard Screen with enhanced dynamic elements and animations
const DashboardScreen = ({ colors, setActiveScreen }) => {
  return (
    <div className="p-6 pb-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">Hi, Sarah!</h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Thursday, March 22</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-1 rounded-full animate-pulse" 
               style={{ background: `radial-gradient(circle, ${colors.neonAccent}50, transparent 70%)` }}></div>
          <button className="relative w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 duration-300"
                  style={{ boxShadow: `0 0 20px ${colors.primary}30` }}>
            <Bell size={24} color={colors.primary} className="transition-transform hover:scale-110 duration-300" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">3</span>
          </button>
        </div>
      </header>
      
      {/* Health Score Card - ENHANCED with more dynamic animations */}
      <div className="mb-8 p-6 rounded-2xl relative overflow-hidden transform hover:scale-105 transition-all duration-500 animate-breathe" 
           style={{ 
             background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
             boxShadow: `0 20px 25px -5px ${colors.primary}50`
           }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full animate-float" 
             style={{ 
               background: `radial-gradient(circle, ${colors.primaryLight}50, transparent 70%)`,
               transform: 'translate(30%, -30%)'
             }}></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full animate-float" 
             style={{ 
               background: `radial-gradient(circle, ${colors.primaryLight}30, transparent 70%)`,
               transform: 'translate(-30%, 30%)',
               animationDelay: '1s'
             }}></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full animate-float" 
             style={{ 
               background: `radial-gradient(circle, ${colors.primaryLight}20, transparent 70%)`,
               transform: 'translate(-50%, -50%)',
               animationDelay: '1.5s'
             }}></div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-white text-opacity-90 text-sm font-medium mb-2">Today's Health Score</p>
            <h2 className="text-4xl font-bold text-white flex items-baseline">
              87<span className="text-xl ml-1">/100</span>
              <span className="ml-3 flex items-center text-sm font-medium bg-white bg-opacity-20 py-1 px-2 rounded-full backdrop-blur-sm">
                <ArrowUpRight size={14} className="mr-1" /> 5%
              </span>
            </h2>
            <p className="text-white text-opacity-80 text-xs mt-1">You're doing better than yesterday!</p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center p-1 transform transition-transform hover:scale-110 duration-300">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center shimmer">
              <Activity size={32} color={colors.primary} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress rings with enhanced animations */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <ProgressRing 
          value={92} 
          label="Activity" 
          icon={<Activity size={18} />} 
          color={colors.accent}
          colors={colors}
        />
        <ProgressRing 
          value={78} 
          label="Sleep" 
          icon={<Clock size={18} />} 
          color={colors.accentAlt}
          colors={colors}
        />
        <ProgressRing 
          value={85} 
          label="Nutrition" 
          icon={<Trophy size={18} />} 
          color={colors.success}
          colors={colors}
        />
      </div>
      
      {/* Upcoming events with enhanced floating cards and hover effects */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Upcoming</h3>
          <button className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md" 
                  style={{ 
                    color: colors.primary, 
                    backgroundColor: `${colors.primary}10`,
                    transform: 'translateZ(0)'
                  }}>
            View all
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white shadow-lg border border-blue-50 flex items-center transform hover:scale-105 transition-all duration-500 hover:shadow-xl"
               style={{ boxShadow: `0 10px 15px -3px ${colors.primary}20` }}>
            <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" 
                 style={{ 
                   background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary})` 
                 }}>
              <Calendar size={22} color="white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-base" style={{ color: colors.textPrimary }}>Metformin 500mg</h4>
              <p className="text-xs" style={{ color: colors.textSecondary }}>In 30 minutes</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 duration-300" 
                 style={{ backgroundColor: `${colors.success}20`, color: colors.success }}>
              <CheckCircle size={18} />
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-white shadow-lg border border-blue-50 flex items-center transform hover:scale-105 transition-all duration-500 hover:shadow-xl"
               style={{ boxShadow: `0 10px 15px -3px ${colors.primary}20` }}>
            <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" 
                 style={{ 
                   background: `linear-gradient(135deg, ${colors.accent}90, ${colors.accent})` 
                 }}>
              <Video size={22} color="white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-base" style={{ color: colors.textPrimary }}>Dr. Johnson Appointment</h4>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Today, 3:00 PM</p>
            </div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-blue-50 transition-transform hover:scale-110 duration-300 hover:bg-blue-100">
              <ChevronRight size={18} color={colors.primary} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Quick actions with enhanced gradient and hover effects */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>Quick Actions</h3>
        <div className="grid grid-cols-3 gap-4">
          <ActionButton 
            label="Log Symptoms" 
            icon={<Heart size={22} />} 
            gradient={`linear-gradient(135deg, ${colors.danger}, ${colors.gradientAlt2})`}
            onClick={() => setActiveScreen('symptoms')} 
          />
          <ActionButton 
            label="Medications" 
            icon={<Calendar size={22} />} 
            gradient={`linear-gradient(135deg, ${colors.primary}, ${colors.accent})`}
            onClick={() => setActiveScreen('medications')} 
          />
          <ActionButton 
            label="Call Doctor" 
            icon={<MessageCircle size={22} />} 
            gradient={`linear-gradient(135deg, ${colors.accent}, ${colors.primary})`}
            onClick={() => setActiveScreen('connect')} 
          />
          <ActionButton 
            label="Health Info" 
            icon={<Zap size={22} />} 
            gradient={`linear-gradient(135deg, ${colors.success}, ${colors.accent})`}
            onClick={() => setActiveScreen('education')} 
          />
          <ActionButton 
            label="Emergency" 
            icon={<AlertTriangle size={22} />} 
            gradient={`linear-gradient(135deg, ${colors.danger}, ${colors.warning})`}
            onClick={() => setActiveScreen('emergency')} 
          />
          <ActionButton 
            label="Reports" 
            icon={<Activity size={22} />} 
            gradient={`linear-gradient(135deg, ${colors.accentAlt}, ${colors.primary})`}
          />
        </div>
      </div>
      
      {/* Health insight with enhanced card design and animations */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Health Insights</h3>
          <button className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md" 
                  style={{ color: colors.primary, backgroundColor: `${colors.primary}10` }}>
            View all
          </button>
        </div>
        
        <div className="p-5 rounded-2xl bg-white shadow-lg border border-blue-50 transform hover:scale-105 transition-all duration-500 hover:shadow-xl"
             style={{ boxShadow: `0 15px 25px -5px ${colors.primary}20` }}>
          <div className="flex items-start">
            <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shadow-md shimmer" 
                 style={{ 
                   background: `linear-gradient(135deg, ${colors.warning}, ${colors.gradientAlt2})`
                 }}>
              <Zap size={22} color="white" />
            </div>
            <div>
              <h4 className="font-bold text-base mb-1" style={{ color: colors.textPrimary }}>Symptom Insight</h4>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Your headaches may be linked to changes in sleep patterns. Try maintaining a consistent sleep schedule.
              </p>
              <button className="mt-3 text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1" 
                      style={{ 
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                        color: 'white',
                        boxShadow: `0 4px 6px -1px ${colors.primary}30`
                      }}>
                Learn more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;