import { ChevronRight } from 'lucide-react';

const MessageCard = ({ title, message, time, colors }) => {
  return (
    <div className="p-4 rounded-2xl bg-white shadow-lg border border-blue-50 transform hover:scale-105 transition-all duration-500 hover:shadow-xl">
      <div className="flex items-center mb-3">
        <div className="flex-1">
          <h4 className="font-medium" style={{ color: colors.textPrimary }}>{title}</h4>
          <p className="text-xs" style={{ color: colors.textSecondary }}>{message}</p>
        </div>
        <ChevronRight size={20} color="black" />
      </div>
      <p className="text-xs text-right" style={{ color: colors.textSecondary }}>{time}</p>
    </div>
  );
};

export default MessageCard;
