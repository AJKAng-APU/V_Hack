import { Heart } from 'lucide-react';

const SymptomCard = ({ symptom, severity, time, note, colors }) => {
  let severityColor, severityGradient;
  if (severity === 'Severe') {
    severityColor = colors.danger;
    severityGradient = `linear-gradient(to right, ${colors.danger}20, ${colors.danger}10)`;
  } else if (severity === 'Moderate') {
    severityColor = colors.warning;
    severityGradient = `linear-gradient(to right, ${colors.warning}20, ${colors.warning}10)`;
  } else {
    severityColor = colors.success;
    severityGradient = `linear-gradient(to right, ${colors.success}20, ${colors.success}10)`;
  }

  return (
    <div className="p-4 rounded-2xl bg-white shadow-lg border border-blue-50 transform hover:scale-105 transition-all duration-500 hover:shadow-xl"
         style={{ boxShadow: `0 10px 15px -3px ${colors.primary}20` }}>
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center shimmer" 
             style={{ 
               background: `linear-gradient(135deg, ${colors.accentAlt}90, ${colors.accentAlt})`
             }}>
          <Heart size={20} color="white" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium" style={{ color: colors.textPrimary }}>{symptom}</h4>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:shadow-sm" 
              style={{ background: severityGradient, color: severityColor }}>
          {severity}
        </span>
      </div>
      <div className="pl-13">
        <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>{time}</p>
        <p className="text-xs p-2 rounded-lg transition-all duration-300 hover:bg-blue-50" 
           style={{ color: colors.textPrimary, backgroundColor: '#F8FAFC' }}>{note}</p>
      </div>
    </div>
  );
};

export default SymptomCard;
