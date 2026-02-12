import { create } from 'zustand';

export const useTabStore = create((set) => ({
    tabs: [],
    activeTab: '/',
    addTab: (path, title) => set((state) => {
        // Prevent duplicates
        if (state.tabs.find(t => t.path === path)) return {};
        return { tabs: [...state.tabs, { path, title }] };
    }),
    removeTab: (path) => set((state) => ({
        tabs: state.tabs.filter(t => t.path !== path)
    })),
    setActiveTab: (path) => set({ activeTab: path })
}));
