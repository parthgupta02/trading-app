import React from 'react';
import { TabList } from './TabList';

import { Bell } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';

interface HeaderProps {
    isOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isOpen }) => {

    return (
        <header
            className={`bg-[#0B1120]/80 backdrop-blur-md border-b border-gray-800 h-12 flex items-center justify-between px-3 fixed top-0 right-0 z-10 transition-all duration-300 ${isOpen ? 'left-64 ml-0' : 'left-14 ml-0'
                }`}
            style={{ width: `calc(100% - ${isOpen ? '16rem' : '3.5rem'})` }}
        >
            <div className="flex-1 overflow-hidden mr-3">
                <TabList />
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">


                <div className="flex items-center space-x-3">
                    <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800">
                        <Bell size={16} />
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#0B1120]"></span>
                    </button>

                    <div className="flex items-center space-x-2 border-l border-gray-800 pl-3">
                        <ProfileDropdown />
                    </div>
                </div>
            </div>
        </header>
    );
};
