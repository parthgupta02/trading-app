
const API_BASE_URL = 'https://us-central1-parth-trading.cloudfunctions.net';

export const createSubscription = async (planId: string, userId: string) => {
    console.log("createSubscription payload:", { planId, userId });
    const response = await fetch(`${API_BASE_URL}/createSubscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, userId }),
    });

    if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch { /* response wasn't JSON */ }
        throw new Error(errorMsg);
    }

    return response.json();
};

export const verifyPayment = async (paymentDetails: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
}) => {
    const response = await fetch(`${API_BASE_URL}/verifyPayment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentDetails),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify payment');
    }

    return response.json();
};

export const cancelSubscription = async (subscriptionId: string) => {
    const response = await fetch(`${API_BASE_URL}/cancelSubscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
    }

    return response.json();
};
