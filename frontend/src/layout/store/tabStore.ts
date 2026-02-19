import { create } from 'zustand';

interface Tab {
    path: string;
    title: string;
}

interface TabState {
    tabs: Tab[];
    activeTab: string;
    addTab: (path: string, title: string) => void;
    removeTab: (path: string) => void;
    setActiveTab: (path: string) => void;
}

export const useTabStore = create<TabState>((set) => ({
    tabs: [],
    activeTab: '/',
    addTab: (path, title) => set((state) => {
        // Prevent duplicates
        if (state.tabs.find(t => t.path === path)) return {};
        // If duplicates are found, we return partial state which is empty object (no change) or we can return state
        // Zustands set merges state, returning {} merges nothing.
        // But better to just return existing state or null?
        // setState behavior:
        // if (state.tabs.find(t => t.path === path)) return state;
        // Actually returning {} is fine if we don't want to change anything, but let's be safe.
        if (state.tabs.some(t => t.path === path)) return state;

        return { tabs: [...state.tabs, { path, title }] };
    }),
    removeTab: (path) => set((state) => ({
        tabs: state.tabs.filter(t => t.path !== path)
    })),
    setActiveTab: (path) => set({ activeTab: path })
}));
