
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart, FileText, History, PieChart, TrendingUp } from 'lucide-react';

const reportTabs = [
    { to: '/report/weekly', label: 'Weekly', Icon: BarChart },
    { to: '/report/monthly', label: 'Monthly', Icon: FileText },
    { to: '/report/history', label: 'History', Icon: History },
    { to: '/report/instrument', label: 'Instrument', Icon: PieChart },
    { to: '/report/win-loss', label: 'Win/Loss', Icon: TrendingUp },
];

export const ReportPage = () => {
    return (
        <div className="space-y-4">
            {/* Mobile Report Sub-Navigation */}
            <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2 min-w-max pb-2">
                    {reportTabs.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) =>
                                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${isActive
                                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                                    : 'bg-[#1F2937] text-gray-400 border border-gray-700/50 hover:text-gray-200 hover:bg-[#1F2937]/80'
                                }`
                            }
                        >
                            <tab.Icon size={14} />
                            {tab.label}
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                <Outlet />
            </div>
        </div>
    );
};

