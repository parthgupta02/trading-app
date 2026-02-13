
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfileDropdown: React.FC = () => {
    const { currentUser, logout, extractMobileFromEmail } = useAuth();
    const { profile } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!currentUser) return null;

    const userInitial = profile.fullName ? profile.fullName.charAt(0).toUpperCase() : (currentUser.email?.charAt(0).toUpperCase() || 'U');
    const mobileNumber = extractMobileFromEmail(currentUser.email);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 focus:outline-none group"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F59E0B] to-yellow-300 flex items-center justify-center text-gray-900 font-bold text-sm shadow-lg shadow-yellow-900/20 transition-transform group-hover:scale-105">
                    {userInitial}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#111827] border border-gray-800 rounded-lg shadow-2xl py-2 z-50 transform origin-top-right transition-all duration-200 animate-in fade-in zoom-in-95">

                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-sm font-semibold text-white truncate">
                            {profile.fullName || 'Trading User'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">
                            {mobileNumber || currentUser.email}
                        </p>
                    </div>

                    {/* Navigation Links */}
                    <div className="py-1">
                        <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-[#1F2937] hover:text-[#F59E0B] transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <User size={16} className="mr-3" />
                            My Profile
                        </Link>
                        <Link
                            to="/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-[#1F2937] hover:text-[#F59E0B] transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Settings size={16} className="mr-3" />
                            Trading Settings
                        </Link>
                    </div>

                    <div className="border-t border-gray-800 my-1"></div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-900/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={16} className="mr-3" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};
