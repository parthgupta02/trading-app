
import { Outlet } from 'react-router-dom';


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
