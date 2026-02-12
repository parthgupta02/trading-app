import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TabContext = createContext();

export const useTabs = () => useContext(TabContext);

export const TabProvider = ({ children }) => {
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState('/');
    const location = useLocation();
    const navigate = useNavigate();

    // Initialize tabs based on current route if empty (optional, but good for refresh)
    useEffect(() => {
        if (tabs.length === 0 && location.pathname !== '/login' && location.pathname !== '/register') {
            const initialTab = {
                path: location.pathname,
                title: getTitleFromPath(location.pathname),
                closable: location.pathname !== '/' // Dashboard might not be closable? or maybe it is.
            };
            if (location.pathname === '/') {
                // Ensure dashboard is always there? Or just let it be added.
                // For now, let's just add the current page.
                addTab(initialTab.path, initialTab.title);
            } else {
                // If deep linking, maybe add dashboard too?
                // Let's keep it simple: just add the current page.
                addTab(initialTab.path, initialTab.title);
            }
        }
    }, []);

    // Sync active tab with location
    useEffect(() => {
        setActiveTab(location.pathname);
    }, [location.pathname]);

    const getTitleFromPath = (path) => {
        if (path === '/') return 'Dashboard';
        if (path === '/gold') return 'Gold Mini';
        if (path === '/silver') return 'Silver Mini';
        if (path === '/report') return 'Report';
        if (path === '/profile') return 'Profile';
        return 'Page';
    };

    const addTab = (path, title) => {
        if (!tabs.find(tab => tab.path === path)) {
            setTabs(prev => [...prev, { path, title }]);
        }
        navigate(path);
    };

    const removeTab = (e, path) => {
        e.stopPropagation();
        const newTabs = tabs.filter(tab => tab.path !== path);
        setTabs(newTabs);

        if (activeTab === path) {
            if (newTabs.length > 0) {
                // Navigate to the last tab
                navigate(newTabs[newTabs.length - 1].path);
            } else {
                // If no tabs left, go to dashboard or define behavior
                navigate('/');
                // Ensure dashboard is added back if we want it always present
                // setTabs([{ path: '/', title: 'Dashboard' }]);
            }
        }
    };

    const handleTabClick = (path) => {
        navigate(path);
    };

    return (
        <TabContext.Provider value={{ tabs, activeTab, addTab, removeTab, handleTabClick }}>
            {children}
        </TabContext.Provider>
    );
};
