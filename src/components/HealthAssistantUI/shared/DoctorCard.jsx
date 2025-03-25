const DoctorCard = ({ name, specialty, image, availability, colors }) => {
    const isAvailableNow = availability.includes('Available') && !availability.includes('in');
    
    return (
      <div className="p-4 rounded-2xl bg-white shadow-lg border border-blue-50 min-w-[160px] transform hover:scale-105 transition-all duration-500 hover:shadow-xl"
           style={{ boxShadow: `0 10px 15px -3px ${colors.primary}20` }}>
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 rounded-full shadow-md mr-3 relative overflow-hidden transition-all duration-300 hover:shadow-lg"
               style={{ boxShadow: `0 0 15px ${colors.primary}30` }}>
            <img src={image} alt={name} className="w-full h-full rounded-full object-cover" />
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white animate-pulse" 
                style={{ backgroundColor: isAvailableNow ? colors.success : colors.warning }}></div>
          </div>
          <div>
            <h4 className="font-medium text-sm" style={{ color: colors.textPrimary }}>{name}</h4>
            <p className="text-xs" style={{ color: colors.textSecondary }}>{specialty}</p>
          </div>
        </div>
        <div className="flex items-center mb-3">
          <span className="text-xs" style={{ color: isAvailableNow ? colors.success : colors.warning }}>
            {availability}
          </span>
        </div>
        <button 
          className="w-full p-2 rounded-lg text-xs font-medium shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1" 
          style={{ 
            background: isAvailableNow 
              ? `linear-gradient(to right, ${colors.primary}, ${colors.accent})`
              : 'white',
            color: isAvailableNow ? 'white' : colors.primary,
            border: isAvailableNow ? 'none' : `1px solid ${colors.primary}`,
            boxShadow: isAvailableNow ? `0 8px 15px -3px ${colors.primary}40` : `0 4px 6px -1px ${colors.primary}20`
          }}
        >
          {isAvailableNow ? 'Connect Now' : 'Schedule'}
        </button>
      </div>
    );
  };

  export default DoctorCard;
