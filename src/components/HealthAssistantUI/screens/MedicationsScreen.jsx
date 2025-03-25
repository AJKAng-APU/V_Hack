import { PlusCircle, CheckCircle, Clock, Zap, AlertTriangle } from "lucide-react";
import MedicationCard from "../shared/MedicationCard";


const MedicationsScreen = ({ colors }) => {
    return (
      <div className="p-6 pb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">Medications</h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Track and manage your prescriptions</p>
          </div>
          <button className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300" 
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                    boxShadow: `0 0 15px ${colors.primary}40`
                  }}>
            <PlusCircle size={24} color="white" />
          </button>
        </header>
        
        {/* Medication adherence with enhanced visuals and animations */}
        <div className="mb-8 p-5 rounded-2xl bg-white shadow-lg border border-blue-50 transform hover:scale-102 transition-all duration-500"
             style={{ boxShadow: `0 15px 25px -5px ${colors.primary}20` }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>Weekly Adherence</h3>
          <div className="flex justify-between items-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              let bgColor, icon;
              if (index <= 1 || index === 3) {
                bgColor = `linear-gradient(135deg, ${colors.success}, ${colors.success}90)`;
                icon = <CheckCircle size={18} color="white" />;
              } else if (index === 2) {
                bgColor = `linear-gradient(135deg, ${colors.warning}, ${colors.warning}90)`;
                icon = <Clock size={18} color="white" />;
              } else {
                bgColor = 'transparent';
                icon = null;
              }
              
              return (
                <div key={day} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md mb-2 transition-transform hover:scale-110 duration-300" 
                       style={{ 
                         background: bgColor,
                         border: index > 3 ? '2px dashed #E5E7EB' : 'none',
                         boxShadow: index <= 3 ? `0 0 10px ${colors.primary}20` : 'none'
                       }}>
                    {icon || <span className="text-xs font-medium text-gray-400">{day[0]}</span>}
                  </div>
                  <span className="text-xs">{day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl shadow-sm flex items-center animate-breathe" 
               style={{ 
                 background: `linear-gradient(to right, ${colors.primary}20, ${colors.accent}10)`
               }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-sm shimmer" 
                 style={{ 
                   background: `linear-gradient(135deg, ${colors.primary}40, ${colors.primary}20)`
                 }}>
              <Zap size={18} color={colors.primary} />
            </div>
            <p className="text-sm font-medium" style={{ color: colors.primary }}>
              You've taken 92% of your medications on time this week!
            </p>
          </div>
        </div>
        
        {/* Today's medications with enhanced card design and hover effects */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>Today's Medications</h3>
          <div className="space-y-4">
            <MedicationCard
              name="Metformin"
              dosage="500mg"
              time="8:00 AM"
              status="taken"
              colors={colors}
            />
            <MedicationCard
              name="Lisinopril"
              dosage="10mg"
              time="8:00 AM"
              status="taken"
              colors={colors}
            />
            <MedicationCard
              name="Atorvastatin"
              dosage="20mg"
              time="9:00 PM"
              status="upcoming"
              colors={colors}
            />
            <MedicationCard
              name="Metformin"
              dosage="500mg"
              time="9:00 PM"
              status="upcoming"
              colors={colors}
            />
          </div>
        </div>
        
        {/* Medication information with enhanced glassmorphism */}
        <div>
          <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>Medication Info</h3>
          <div className="p-5 rounded-2xl bg-white shadow-lg border border-blue-100 backdrop-blur-sm transform hover:scale-105 transition-all duration-500"
               style={{ boxShadow: `0 15px 25px -5px ${colors.primary}20` }}>
            <h4 className="font-bold text-base mb-2" style={{ color: colors.textPrimary }}>Metformin Interactions</h4>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              Take Metformin with meals to reduce stomach upset. Avoid alcohol while on this medication.
            </p>
            <div className="p-3 rounded-xl animate-breathe" style={{ backgroundColor: `${colors.warning}20` }}>
              <p className="text-sm font-medium flex items-center" style={{ color: colors.warning }}>
                <AlertTriangle size={16} className="mr-2 flex-shrink-0" /> May interact with Ibuprofen. Consult your doctor before taking together.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default MedicationsScreen;
