
import { Outlet } from 'react-router-dom';
import { Card } from '../components/ui/Card';

export const ReportPage = () => {
    return (
        <div className="space-y-6">


            {/* Content Area */}
            <div className="min-h-[500px]">
                <Outlet />
            </div>
        </div>
    );
};
