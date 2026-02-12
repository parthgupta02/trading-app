
import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', activeClass: 'bg-yellow-600 text-gray-900', defaultClass: 'text-gray-300 hover:bg-gray-700' },
        { name: 'Gold Mini', path: '/gold', activeClass: 'bg-yellow-600 text-gray-900', defaultClass: 'text-gray-300 hover:bg-gray-700' },
        { name: 'Silver Mini', path: '/silver', activeClass: 'bg-blue-600 text-white', defaultClass: 'text-gray-300 hover:bg-gray-700' },
        { name: 'Report', path: '/report', activeClass: 'bg-green-600 text-white', defaultClass: 'text-gray-300 hover:bg-gray-700' },
        { name: 'Profile', path: '/profile', activeClass: 'bg-blue-600 text-white', defaultClass: 'text-gray-300 hover:bg-gray-700' },
    ];

    return (
        <nav className="mb-6 p-2 bg-gray-800 rounded-xl shadow-lg flex justify-start flex-nowrap overflow-x-auto space-x-2 sm:space-x-4 border border-gray-700">
            {navItems.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                        `py-2 px-4 rounded-lg font-semibold transition duration-150 whitespace-nowrap ${isActive ? item.activeClass : item.defaultClass
                        }`
                    }
                >
                    {item.name}
                </NavLink>
            ))}
        </nav>
    );
};
