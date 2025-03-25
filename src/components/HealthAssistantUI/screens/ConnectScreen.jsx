import { Menu } from "lucide-react"; // アイコンライブラリを使っている場合
import { MessageCircle, Video } from "lucide-react"; // これもlucide-reactから取得できる可能性あり
import DoctorCard from "../shared/DoctorCard"; // 実際のファイルパスを確認
import MessageCard from "../shared/MessageCard"; // 実際のファイルパスを確認


const ConnectScreen = ({ colors }) => {
    return (
      <div className="p-6 pb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">Connect</h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Communicate with your care team</p>
          </div>
          <button className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300" 
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                    boxShadow: `0 0 15px ${colors.primary}40`
                  }}>
            <Menu size={24} color="white" />
          </button>
        </header>
        
        {/* Care team with enhanced card animations */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>Your Care Team</h3>
          <div className="flex overflow-x-auto pb-2 -mx-2 px-2 space-x-4">
            <DoctorCard
              name="Dr. Johnson"
              specialty="Cardiologist"
              image="/User_1.png"
              availability="Available"
              colors={colors}
            />
            <DoctorCard
              name="Dr. Smith"
              specialty="Primary Care"
              image="/User_2.jpg"
              availability="Available in 15m"
              colors={colors}
            />
            <DoctorCard
              name="Dr. Garcia"
              specialty="Endocrinologist"
              image="/User_3.png"
              availability="Available tomorrow"
              colors={colors}
            />
          </div>
        </div>
        
        {/* Communication options with enhanced gradient backgrounds and hover effects */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>Communication</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-5 rounded-2xl bg-white shadow-lg flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl"
                   style={{ boxShadow: `0 15px 25px -5px ${colors.primary}20` }}>
              <div className="w-16 h-16 rounded-full mb-3 flex items-center justify-center shadow-md shimmer transition-transform hover:scale-110 duration-300" 
                   style={{ 
                     background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                     boxShadow: `0 0 15px ${colors.primary}30`
                   }}>
                <MessageCircle size={28} color="white" />
              </div>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Message</span>
            </button>
            <button className="p-5 rounded-2xl bg-white shadow-lg flex flex-col items-center transform transition-all duration-500 hover:scale-105 hover:shadow-xl"
                   style={{ boxShadow: `0 15px 25px -5px ${colors.primary}20` }}>
              <div className="w-16 h-16 rounded-full mb-3 flex items-center justify-center shadow-md shimmer transition-transform hover:scale-110 duration-300" 
                   style={{ 
                     background: `linear-gradient(135deg, ${colors.accentAlt}, ${colors.accent})`,
                     boxShadow: `0 0 15px ${colors.accentAlt}30` 
                   }}>
                <Video size={28} color="white" />
              </div>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Video Call</span>
            </button>
          </div>
        </div>
        
        {/* Recent messages with enhanced card design and animations */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Recent Messages</h3>
            <button className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md" 
                    style={{ color: colors.primary, backgroundColor: `${colors.primary}10` }}>
              View all
            </button>
          </div>
          
          <div className="space-y-4">
            <MessageCard
              doctor="Dr. Johnson"
              message="Your latest blood pressure readings look good. Keep up the good work!"
              time="Today, 10:23 AM"
              unread={true}
              colors={colors}
            />
            <MessageCard
              doctor="Dr. Smith"
              message="I've adjusted your medication schedule. Please review the changes."
              time="Yesterday, 4:15 PM"
              unread={false}
              colors={colors}
            />
            <MessageCard
              doctor="Nurse Williams"
              message="How are you feeling after the new medication?"
              time="Mar 20, 9:30 AM"
              unread={false}
              colors={colors}
            />
          </div>
        </div>
      </div>
    );
  };

  export default ConnectScreen;