import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Coins, FileText } from 'lucide-react';


export const BottomNavigation = () => {
    const navItems = [
        { to: "/", icon: <LayoutDashboard size={20} />, label: "Home" },
        { to: "/gold", icon: <Coins size={20} className="text-yellow-500" />, label: "Gold" },
        { to: "/silver", icon: <Coins size={20} className="text-gray-400" />, label: "Silver" },
        { to: "/report", icon: <FileText size={20} />, label: "Report" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1F2937] border-t border-gray-800 pb-safe pt-2 px-4 flex justify-between items-center z-50 h-16 safe-area-bottom">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
                        flex flex-col items-center justify-center w-full h-full space-y-1
                        ${isActive ? 'text-[#F59E0B]' : 'text-gray-500 hover:text-gray-300'}
                        transition-colors duration-200
                    `}
                >
                    {item.icon}
                    <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
            ))}
        </div>
    );
};
