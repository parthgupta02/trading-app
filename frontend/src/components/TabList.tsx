import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTabStore } from '../store/tabStore';

export const TabList: React.FC = () => {
    const { tabs, activeTab, removeTab } = useTabStore();
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active tab
    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeElement = scrollContainerRef.current.querySelector('[data-active="true"]');
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeTab]);

    const handleTabClick = (path: string) => {
        navigate(path);
    };

    const handleRemoveTab = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();

        // Find tab index to determine next tab before removing
        const tabIndex = tabs.findIndex(t => t.path === path);
        const isActive = activeTab === path;

        // Update store
        removeTab(path);

        // Navigate if active tab was closed
        if (isActive) {
            const newTabs = tabs.filter(t => t.path !== path);
            if (newTabs.length > 0) {
                // Try to go to the previous one
                const nextIndex = Math.max(0, tabIndex - 1);
                navigate(newTabs[nextIndex].path);
            } else {
                navigate('/');
            }
        }
    };

    return (
        <div
            ref={scrollContainerRef}
            className="flex items-center space-x-2 overflow-x-auto no-scrollbar mask-gradient-right py-1"
        >
            {tabs.map((tab) => (
                <div
                    key={tab.path}
                    data-active={activeTab === tab.path}
                    onClick={() => handleTabClick(tab.path)}
                    className={`
                        group flex items-center space-x-2 px-4 py-1.5 rounded-lg cursor-pointer transition-all duration-200 border text-sm whitespace-nowrap select-none
                        ${activeTab === tab.path
                            ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-sm shadow-yellow-500/20'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750 hover:text-gray-200 hover:border-gray-600'
                        }
                    `}
                >
                    <span>{tab.title}</span>
                    {tab.title !== 'Dashboard' && (
                        <button
                            onClick={(e) => handleRemoveTab(e, tab.path)}
                            className={`p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === tab.path ? 'hover:bg-yellow-500/20 text-yellow-500' : 'hover:bg-gray-600 text-gray-400'
                                }`}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};
