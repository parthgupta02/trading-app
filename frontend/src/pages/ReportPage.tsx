
import { Outlet } from 'react-router-dom';
import { Card } from '../components/ui/Card';

export const ReportPage = () => {
    return (
        <div className="space-y-6">
            <Card className="border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
                <h1 className="text-3xl font-bold text-white mb-2">Performance Reports</h1>
                <p className="text-gray-400">View your realized profit and loss across all trades.</p>
            </Card>

            {/* Content Area */}
            <div className="min-h-[500px]">
                <Outlet />
            </div>
        </div>
    );
};
