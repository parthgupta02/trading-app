import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Coins,
    TrendingUp,
    FileText,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTabStore } from '../store/tabStore';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const { logout } = useAuth();
    const { addTab } = useTabStore();

    const navItems = [
        { name: 'Dashboard', path: '/', Icon: LayoutDashboard },
        { name: 'Gold Mini', path: '/gold', Icon: Coins },
        { name: 'Silver Mini', path: '/silver', Icon: TrendingUp },
        { name: 'Report', path: '/report', Icon: FileText },
    ];

    const handleNavigation = (path: string, name: string) => {
        addTab(path, name);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <aside
            className={`bg-[#111827] border-r border-gray-800 transition-all duration-300 ease-in-out flex flex-col h-screen fixed left-0 top-0 z-20 ${isOpen ? 'w-56' : 'w-16'
                }`}
        >
            <div className="flex items-center justify-between p-3 border-b border-gray-800 h-14">
                {isOpen && (
                    <span className="text-lg font-bold text-[#F59E0B] flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        Trading App
                    </span>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                    {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {isOpen ? 'Main Menu' : ''}
                </div>
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                onClick={() => handleNavigation(item.path, item.name)}
                                className={({ isActive }) =>
                                    `flex items-center p-2 rounded-md transition-all duration-200 group relative ${isActive
                                        ? 'bg-[#1F2937] text-[#F59E0B] border-l-2 border-[#F59E0B]'
                                        : 'text-gray-400 hover:bg-[#1F2937] hover:text-gray-200'
                                    }`
                                }
                            >
                                <span className={`flex-shrink-0 ${isOpen ? 'mr-3' : 'mx-auto'}`}>
                                    <item.Icon size={18} />
                                </span>
                                {isOpen && (
                                    <span className="font-medium whitespace-nowrap text-sm">{item.name}</span>
                                )}
                                {!isOpen && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg border border-gray-700">
                                        {item.name}
                                    </div>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-3 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className={`flex items-center w-full p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${!isOpen && 'justify-center'
                        }`}
                >
                    <LogOut size={18} className={isOpen ? 'mr-3' : ''} />
                    {isOpen && <span className="text-sm font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
};
