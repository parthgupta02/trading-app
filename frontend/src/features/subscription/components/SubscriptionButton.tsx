import { useState } from 'react';
import { useRazorpay } from '../hooks/useRazorpay';
import { createSubscription, verifyPayment } from '../../../shared/lib/api';

interface SubscriptionButtonProps {
    planId: string;
}

export const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({ planId }) => {
    const isRazorpayLoaded = useRazorpay();
    const [loading, setLoading] = useState(false);

    const handleSubscription = async () => {
        if (!isRazorpayLoaded) {
            alert('Razorpay SDK not loaded. Please try again.');
            return;
        }

        setLoading(true);

        try {
            // 1. Create Subscription
            const data = await createSubscription(planId);
            const { subscription_id } = data;

            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                subscription_id: subscription_id,
                name: 'Trading App',
                description: 'Monthly Subscription',
                handler: async (response: any) => {
                    try {
                        // 3. Verify Payment
                        await verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        alert('Subscription successful!');
                    } catch (error) {
                        console.error(error);
                        alert('Payment verification failed.');
                    }
                },
                theme: {
                    color: '#F37254',
                },
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();
        } catch (error: any) {
            console.error(error);
            alert(`Failed to start subscription: ${error.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSubscription}
            disabled={loading || !isRazorpayLoaded}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400`}
        >
            {loading ? 'Processing...' : 'Subscribe Now'}
        </button>
    );
};
