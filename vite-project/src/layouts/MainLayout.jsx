
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export const MainLayout = () => {
    const { extractMobileFromEmail, currentUser } = useAuth();
    const mobile = extractMobileFromEmail(currentUser?.email);

    return (
        <div className="max-w-6xl mx-auto pt-4 pb-12 px-4 sm:px-6">
            <Navbar />
            <main>
                <Outlet />
            </main>
            <footer className="mt-8 text-xs text-center text-gray-500">
                Logged in with: <span className="font-mono text-yellow-400">{mobile}</span>
            </footer>
        </div>
    );
};
