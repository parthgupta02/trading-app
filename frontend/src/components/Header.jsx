import React from 'react';
import { TabList } from './TabList';
import { useAuth } from '../context/AuthContext';
import { Bell, Search } from 'lucide-react';

export const Header = ({ isOpen }) => {
    const { currentUser } = useAuth();

    return (
        <header
            className={`bg-gray-900 border-b border-gray-800 h-16 flex items-center justify-between px-4 fixed top-0 right-0 z-10 transition-all duration-300 ${isOpen ? 'left-64 ml-0' : 'left-20 ml-0'
                }`}
            style={{ width: `calc(100% - ${isOpen ? '16rem' : '5rem'})` }}
        >
            <div className="flex-1 overflow-hidden mr-4">
                <TabList />
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-yellow-500 w-48 transition-all"
                    />
                </div>

                <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-yellow-300 flex items-center justify-center text-gray-900 font-bold text-sm">
                        {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};
