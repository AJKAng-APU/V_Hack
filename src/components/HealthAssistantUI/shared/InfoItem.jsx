const InfoItem = ({ label, value, colors }) => {
    return (
      <div className="flex items-center p-2 rounded-lg transition-all duration-300 hover:bg-blue-50" 
           style={{ backgroundColor: '#F8FAFC' }}>
        <span className="text-sm font-medium w-24" style={{ color: colors.textSecondary }}>{label}:</span>
        <span className="text-sm flex-1 font-medium" style={{ color: colors.textPrimary }}>{value}</span>
      </div>
    );
  };

  export default InfoItem;