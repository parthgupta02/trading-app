
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Outlet />
                <footer className="mt-8 text-xs text-center text-gray-500">
                    Please log in or sign up to continue.
                </footer>
            </div>
        </div>
    );
};
