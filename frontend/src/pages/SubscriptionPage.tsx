
import { SubscriptionButton } from '../components/SubscriptionButton';

export const SubscriptionPage = () => {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Subscription Plan</h1>
            <div className="border p-6 rounded-lg shadow-md max-w-md bg-white">
                <h2 className="text-xl font-semibold mb-2">Pro Plan</h2>
                <p className="text-gray-600 mb-4">Get access to premium features.</p>
                <p className="text-2xl font-bold mb-6">₹100 / month</p>
                <SubscriptionButton planId="plan_SHEbDwd8JZFPZQ" />
            </div>
        </div>
    );
};
