const CategoryButton = ({ label, icon, gradient }) => {
    return (
      <button className="p-4 rounded-2xl bg-white shadow-lg flex items-center transform hover:scale-105 transition-all duration-500 hover:shadow-xl"
             style={{ boxShadow: `0 10px 15px -3px rgba(0,0,0,0.1)` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shimmer transition-transform hover:scale-110 duration-300" 
             style={{ 
               background: gradient,
               boxShadow: '0 8px 15px -3px rgba(0,0,0,0.2)'
             }}>
          <div style={{ color: 'white' }}>{icon}</div>
        </div>
        <span className="text-sm font-medium">{label}</span>
      </button>
    );
  };

  export default CategoryButton;