import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Coins,
    TrendingUp,
    FileText,
    User,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTabStore } from '../store/tabStore';

export const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { logout } = useAuth();
    const { addTab } = useTabStore();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Gold Mini', path: '/gold', icon: <Coins size={20} /> },
        { name: 'Silver Mini', path: '/silver', icon: <TrendingUp size={20} /> },
        { name: 'Report', path: '/report', icon: <FileText size={20} /> },
        { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    ];

    const handleNavigation = (path, name) => {
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
            className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out flex flex-col h-screen fixed left-0 top-0 z-20 ${isOpen ? 'w-64' : 'w-20'
                }`}
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-800 h-16">
                {isOpen && (
                    <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                        Trading App
                    </span>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-2 px-2">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                onClick={() => handleNavigation(item.path, item.name)}
                                className={({ isActive }) =>
                                    `flex items-center p-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-yellow-600/10 text-yellow-500 border-l-2 border-yellow-500'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`
                                }
                            >
                                <span className={`flex-shrink-0 ${isOpen ? 'mr-3' : 'mx-auto'}`}>
                                    {item.icon}
                                </span>
                                {isOpen && (
                                    <span className="font-medium whitespace-nowrap">{item.name}</span>
                                )}
                                {!isOpen && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                        {item.name}
                                    </div>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className={`flex items-center w-full p-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${!isOpen && 'justify-center'
                        }`}
                >
                    <LogOut size={20} className={isOpen ? 'mr-3' : ''} />
                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};
