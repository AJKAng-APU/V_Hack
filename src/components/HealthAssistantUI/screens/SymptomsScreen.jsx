import { PlusCircle, Zap } from "lucide-react"; 
import SymptomCard from "../shared/SymptomCard"; 

const SymptomsScreen = ({ colors }) => {
    return (
      <div className="p-6 pb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">Symptoms</h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Track your health patterns</p>
          </div>
          <button className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300" 
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                    boxShadow: `0 0 15px ${colors.primary}40`
                  }}>
            <PlusCircle size={24} color="white" className="animate-pulse" />
          </button>
        </header>
        
        {/* Symptom summary with enhanced gradients and animations */}
        <div className="mb-8 p-5 rounded-2xl relative overflow-hidden transform hover:scale-105 transition-all duration-500 animate-breathe"
             style={{ 
               background: `linear-gradient(135deg, ${colors.gradientAlt1}, ${colors.gradientAlt2})`,
               boxShadow: `0 20px 25px -5px ${colors.gradientAlt1}30`
             }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full animate-float" 
               style={{ 
                 background: `radial-gradient(circle, ${colors.primaryLight}30, transparent 70%)`,
                 transform: 'translate(30%, -30%)'
               }}></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full animate-float" 
               style={{ 
                 background: `radial-gradient(circle, ${colors.primaryLight}20, transparent 70%)`,
                 transform: 'translate(-30%, 30%)',
                 animationDelay: '1s'
               }}></div>
               
          <div className="relative">
            <h3 className="text-white font-bold text-xl mb-3">Monthly Summary</h3>
            <p className="text-white text-opacity-90 text-sm mb-5">Your most frequent symptoms this month:</p>
            
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 mb-4 transition-transform hover:scale-105 duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white text-sm font-medium">Headaches</span>
                <span className="text-white text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">8 occurrences</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 h-3 rounded-full overflow-hidden">
                <div className="bg-white h-3 rounded-full shimmer" style={{ width: '80%' }}></div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 transition-transform hover:scale-105 duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white text-sm font-medium">Fatigue</span>
                <span className="text-white text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">5 occurrences</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 h-3 rounded-full overflow-hidden">
                <div className="bg-white h-3 rounded-full shimmer" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent symptoms with enhanced card designs */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Recent Symptoms</h3>
            <button className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md" 
                    style={{ color: colors.primary, backgroundColor: `${colors.primary}10` }}>
              View all
            </button>
          </div>
          
          <div className="space-y-4">
            <SymptomCard
              symptom="Headache"
              severity="Moderate"
              time="Today, 2:30 PM"
              note="Frontal region, throbbing"
              colors={colors}
            />
            <SymptomCard
              symptom="Fatigue"
              severity="Mild"
              time="Yesterday, 7:00 PM"
              note="After walking up stairs"
              colors={colors}
            />
            <SymptomCard
              symptom="Dizziness"
              severity="Mild"
              time="Mar 20, 10:15 AM"
              note="When standing up quickly"
              colors={colors}
            />
          </div>
        </div>
        
        {/* AI Insights with enhanced gradient and animations */}
        <div>
          <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>AI Insights</h3>
          <div className="p-5 rounded-2xl bg-white shadow-lg border border-blue-100 transform hover:scale-105 transition-all duration-500"
               style={{ boxShadow: `0 15px 25px -5px ${colors.primary}20` }}>
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" 
                   style={{ 
                     background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`
                   }}>
                <Zap size={22} color="white" />
              </div>
              <div>
                <h4 className="font-bold text-base mb-2" style={{ color: colors.textPrimary }}>Pattern Detected</h4>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Your headaches tend to occur after extended screen time. Consider taking breaks using the 20-20-20 rule.
                </p>
                <div className="flex mt-3">
                  <button className="mr-4 text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1" 
                          style={{ 
                            background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                            color: 'white',
                            boxShadow: `0 4px 6px -1px ${colors.primary}30`
                          }}>
                    Learn more
                  </button>
                  <button className="text-sm font-medium px-4 py-1.5 rounded-lg border border-gray-200 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default SymptomsScreen;
