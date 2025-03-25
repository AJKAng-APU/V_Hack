import { Clock } from "lucide-react"; 

const ArticleCard = ({ title, description, time, colors }) => {
  return (
    <div className="p-4 rounded-2xl bg-white shadow-lg border border-blue-50 transform hover:scale-105 transition-all duration-500 hover:shadow-xl">
      <div className="flex items-center mb-3">
        <div className="flex-1">
          <h4 className="font-medium" style={{ color: colors.textPrimary }}>{title}</h4>
          <p className="text-xs" style={{ color: colors.textSecondary }}>{description}</p>
        </div>
        <Clock size={16} color="gray" />
      </div>
      <p className="text-xs text-right" style={{ color: colors.textSecondary }}>{time}</p>
    </div>
  );
};

export default ArticleCard;
