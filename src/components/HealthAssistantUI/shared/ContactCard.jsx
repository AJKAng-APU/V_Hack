const ContactCard = ({ name, relation, phone, colors }) => {
    return (
      <div className="p-4 rounded-2xl bg-white shadow-lg border border-blue-50 flex items-center justify-between transform hover:scale-105 transition-all duration-500 hover:shadow-xl"
           style={{ boxShadow: `0 10px 15px -3px ${colors.primary}20` }}>
        <div>
          <h4 className="font-medium text-base" style={{ color: colors.textPrimary }}>{name}</h4>
          <p className="text-xs" style={{ color: colors.textSecondary }}>{relation}</p>
          <p className="text-xs font-medium mt-1" style={{ color: colors.primary }}>{phone}</p>
        </div>
        <button className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 duration-300 shimmer" 
                style={{ 
                  background: `linear-gradient(135deg, ${colors.success}, ${colors.success}90)`,
                  boxShadow: `0 0 15px ${colors.success}30`
                }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </button>
      </div>
    );
  };

  export default ContactCard;