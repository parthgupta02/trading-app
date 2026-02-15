import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '../components/BottomNavigation';
import { ProfileDropdown } from '../components/ProfileDropdown';

export const MobileLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-[#0B1120] text-gray-100 font-sans pb-20">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 bg-[#1F2937] border-b border-gray-800 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#B45309] flex items-center justify-center font-bold text-white">
                        T
                    </div>
                    <h1 className="text-lg font-bold tracking-tight">Trading App</h1>
                </div>
                <ProfileDropdown />
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-y-auto w-full max-w-full overflow-x-hidden">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
};
