
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Tab {
    path: string;
    title: string;
    closable?: boolean;
}

interface TabContextType {
    tabs: Tab[];
    activeTab: string;
    addTab: (path: string, title: string) => void;
    removeTab: (e: React.MouseEvent, path: string) => void;
    handleTabClick: (path: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabs = () => {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTabs must be used within a TabProvider');
    }
    return context;
};

interface TabProviderProps {
    children: ReactNode;
}

export const TabProvider: React.FC<TabProviderProps> = ({ children }) => {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTab, setActiveTab] = useState('/');
    const location = useLocation();
    const navigate = useNavigate();

    const getTitleFromPath = (path: string) => {
        if (path === '/') return 'Dashboard';
        if (path === '/gold') return 'Gold Mini';
        if (path === '/silver') return 'Silver Mini';
        if (path === '/report') return 'Report';
        if (path === '/profile') return 'Profile';
        return 'Page';
    };

    const addTab = (path: string, title: string) => {
        if (!tabs.find(tab => tab.path === path)) {
            setTabs(prev => [...prev, { path, title }]);
        }
        navigate(path);
    };

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

    const removeTab = (e: React.MouseEvent, path: string) => {
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

    const handleTabClick = (path: string) => {
        navigate(path);
    };

    return (
        <TabContext.Provider value={{ tabs, activeTab, addTab, removeTab, handleTabClick }}>
            {children}
        </TabContext.Provider>
    );
};
