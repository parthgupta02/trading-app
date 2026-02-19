import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Coins,
    TrendingUp,
    FileText,
    LogOut,
    ChevronDown,
    ChevronRight,
    BarChart,
    History,
    PieChart,

} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTabStore } from '../store/tabStore';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

interface NavItem {
    name: string;
    path: string;
    Icon: React.ElementType;
    submenu?: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const { logout } = useAuth();
    const { addTab } = useTabStore();
    const location = useLocation();
    const [openSubmenu, setOpenSubmenu] = useState<string | null>('Report');

    const navItems: NavItem[] = [
        { name: 'Dashboard', path: '/', Icon: LayoutDashboard },
        { name: 'Gold Mini', path: '/gold', Icon: Coins },
        { name: 'Silver Mini', path: '/silver', Icon: TrendingUp },
        {
            name: 'Report',
            path: '/report',
            Icon: FileText,
            submenu: [
                { name: 'Trade History', path: '/report/history', Icon: History },
                { name: 'Weekly Report', path: '/report/weekly', Icon: BarChart },
                { name: 'Monthly Report', path: '/report/monthly', Icon: FileText },
                { name: 'Instrument Analysis', path: '/report/instrument', Icon: PieChart },
                { name: 'P&L Analysis', path: '/report/win-loss', Icon: TrendingUp },
            ]
        },

    ];

    const handleNavigation = (item: NavItem) => {
        if (item.submenu) {
            if (!isOpen) {
                toggleSidebar();
                setOpenSubmenu(item.name);
            } else {
                setOpenSubmenu(openSubmenu === item.name ? null : item.name);
            }
        } else {
            addTab(item.path, item.name);
        }
    };

    const handleSubItemClick = (path: string, name: string) => {
        addTab(path, name);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const isActiveLink = (path: string, isSubItem = false) => {
        if (path === '/' && location.pathname !== '/') return false;
        if (isSubItem) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <aside
            className={`bg-[#111827] border-r border-gray-800 transition-all duration-300 ease-in-out flex flex-col h-screen fixed left-0 top-0 z-20 ${isOpen ? 'w-64' : 'w-14'
                }`}
        >
            <div
                className={`flex items-center h-11 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors ${isOpen ? 'px-3 justify-start' : 'justify-center p-1.5'}`}
                onClick={toggleSidebar}
            >
                <img src="/icons/icon-192.webp" alt="Logo" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                {isOpen && (
                    <span className="text-sm font-bold text-[#F59E0B] ml-2 whitespace-nowrap overflow-hidden transition-opacity duration-300">Trading App</span>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                <div className="px-3 mb-1 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    {isOpen ? 'Main Menu' : ''}
                </div>
                <ul className="space-y-0.5 px-1.5">
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <div
                                onClick={() => handleNavigation(item)}
                                className={`
                                    flex items-center p-1.5 rounded-md transition-all duration-200 group relative cursor-pointer
                                    ${isActiveLink(item.path) && !item.submenu
                                        ? 'bg-[#1F2937] text-[#F59E0B] border-l-2 border-[#F59E0B]'
                                        : 'text-gray-400 hover:bg-[#1F2937] hover:text-gray-200'
                                    }
                                `}
                            >
                                {item.submenu ? (
                                    // Parent Item with Submenu (Not a Link)
                                    <div className="flex items-center w-full">
                                        <span className={`flex-shrink-0 ${isOpen ? 'mr-2' : 'mx-auto'}`}>
                                            <item.Icon size={16} />
                                        </span>
                                        {isOpen && (
                                            <>
                                                <span className="font-medium whitespace-nowrap text-xs flex-1">{item.name}</span>
                                                {openSubmenu === item.name ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    // Regular Link Item
                                    <NavLink
                                        to={item.path}
                                        className="flex items-center w-full"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent parent div click
                                            handleNavigation(item);
                                        }}
                                    >
                                        <span className={`flex-shrink-0 ${isOpen ? 'mr-2' : 'mx-auto'}`}>
                                            <item.Icon size={16} />
                                        </span>
                                        {isOpen && (
                                            <span className="font-medium whitespace-nowrap text-xs">{item.name}</span>
                                        )}
                                    </NavLink>
                                )}

                                {!isOpen && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg border border-gray-700">
                                        {item.name}
                                    </div>
                                )}
                            </div>

                            {/* Submenu */}
                            {isOpen && item.submenu && openSubmenu === item.name && (
                                <ul className="mt-0.5 ml-6 space-y-0.5 border-l border-gray-800 pl-2">
                                    {item.submenu.map((subItem) => (
                                        <li key={subItem.path}>
                                            <NavLink
                                                to={subItem.path}
                                                onClick={() => handleSubItemClick(subItem.path, subItem.name)}
                                                className={({ isActive }) =>
                                                    `block py-1.5 px-2 rounded-md text-xs transition-colors ${isActive
                                                        ? 'text-[#F59E0B] bg-gray-800/50'
                                                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                                                    }`
                                                }
                                            >
                                                <div className="flex items-center">
                                                    <span>{subItem.name}</span>
                                                </div>
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-2 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className={`flex items-center w-full p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${!isOpen && 'justify-center'
                        }`}
                >
                    <LogOut size={16} className={isOpen ? 'mr-2' : ''} />
                    {isOpen && <span className="text-xs font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
};
