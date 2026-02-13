import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useTabStore } from '../store/tabStore';

export const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { extractMobileFromEmail, currentUser } = useAuth();
    const mobile = extractMobileFromEmail(currentUser?.email || '');

    // Zustand Tab Sync
    const location = useLocation();
    const { setActiveTab, addTab } = useTabStore();

    useEffect(() => {
        setActiveTab(location.pathname);
        // Ensure current tab is in the list (e.g., on page reload)
        // We need a way to know the title. A simple map for now.
        const path = location.pathname;
        let title = 'Page';
        if (path === '/') title = 'Dashboard';
        else if (path === '/gold') title = 'Gold Mini';
        else if (path === '/silver') title = 'Silver Mini';
        else if (path === '/report') title = 'Report';
        else if (path === '/profile') title = 'Profile';
        else if (path === '/settings') title = 'Trading Settings';

        // Only if we have a known title or it's dynamic
        if (path !== '/login' && path !== '/register') {
            addTab(path, title);
        }

    }, [location.pathname, setActiveTab, addTab]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen bg-[#0B1120] text-gray-100 overflow-hidden font-sans">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <div className={`flex-1 flex flex-col transition-all duration-300 relative ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <Header isOpen={isSidebarOpen} />

                <main className="flex-1 overflow-y-auto p-6 mt-16">
                    <Outlet />

                    <footer className="mt-8 pt-8 border-t border-gray-800 text-xs text-center text-gray-500 pb-4">
                        Logged in with: <span className="font-mono text-yellow-400">{mobile}</span>
                    </footer>
                </main>
            </div>
        </div>
    );
};
