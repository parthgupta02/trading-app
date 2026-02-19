import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { ProfileDropdown } from '../../../layout/components/ProfileDropdown';
import { useRazorpay } from '../hooks/useRazorpay';
import { createSubscription, verifyPayment } from '../../../shared/lib/api';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../shared/lib/firebase';
import {
    Check,
    Star,
    Zap,
    Shield,
    ArrowRight,
    Crown,
    X,
} from 'lucide-react';

/* ─── Plan Data ─── */
const plans = [
    {
        id: 'free',
        name: 'Free Plan',
        icon: Shield,
        tagline: 'Try it out for 2 weeks',
        price: '₹0',
        period: '',
        monthly: '',
        savings: '',
        oldPrice: '',
        badge: null,
        highlight: false,
        cta: 'Start Free',
        ctaStyle:
            'bg-gray-700 hover:bg-gray-600 text-white',
        features: [
            { text: 'Basic dashboard access', included: true },
            { text: 'Add Buy / Sell trades', included: true },
            { text: 'P&L calculation', included: true },
            { text: 'Export to PDF', included: false },
            { text: 'Weekly reports', included: false },
            { text: 'Priority support', included: false },
        ],
    },
    {
        id: 'monthly',
        name: 'Monthly Plan',
        icon: Zap,
        tagline: 'Full access, billed monthly',
        price: '₹499',
        period: '/month',
        monthly: '',
        savings: '',
        oldPrice: '',
        badge: null,
        highlight: false,
        cta: 'Subscribe Monthly',
        ctaStyle:
            'bg-blue-600 hover:bg-blue-500 text-white',
        features: [
            { text: 'Everything in Free', included: true },
            { text: 'Unlimited trades', included: true },
            { text: 'Export to PDF & CSV', included: true },
            { text: 'Weekly & Monthly reports', included: true },
            { text: 'Instrument analysis', included: true },
            { text: 'Priority support', included: true },
        ],
    },
    {
        id: 'yearly',
        name: 'Yearly Plan',
        icon: Crown,
        tagline: 'Best value — save 20%',
        price: '₹4,790',
        period: '/year',
        monthly: 'Just ₹399/month',
        savings: 'Save ₹1,198 yearly',
        oldPrice: '₹499/month',
        badge: 'Best Value',
        highlight: true,
        cta: 'Subscribe Yearly',
        ctaStyle:
            'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-900 font-bold shadow-lg shadow-amber-500/25',
        features: [
            { text: 'Everything in Monthly', included: true },
            { text: 'Unlimited trades', included: true },
            { text: 'Export to PDF & CSV', included: true },
            { text: 'All reports & analytics', included: true },
            { text: 'Instrument analysis', included: true },
            { text: 'Priority support', included: true },
        ],
    },
];

/* ─── Razorpay Plan ID Map ─── */
const RAZORPAY_PLAN_IDS: Record<string, string> = {
    monthly: 'plan_SHEbDwd8JZFPZQ',
    // yearly: 'plan_XXXXXXXX',  // Add yearly plan ID here when ready
};

export const SubscriptionPage = () => {
    const { currentUser, activateFreeTrial, hasActiveSubscription, refreshSubscription, subscriptionData, freeTrialUsed } = useAuth();
    const navigate = useNavigate();
    const isRazorpayLoaded = useRazorpay();
    const [loading, setLoading] = useState(false);

    // If user already has active subscription (AND it's not a free trial), redirect to dashboard
    useEffect(() => {
        if (hasActiveSubscription && subscriptionData?.plan !== 'free') {
            navigate('/', { replace: true });
        }
    }, [hasActiveSubscription, subscriptionData, navigate]);

    const isFreePlanDisabled = freeTrialUsed || (subscriptionData?.plan === 'free' && hasActiveSubscription);

    const handleSelect = async (planId: string) => {
        if (planId === 'free') {
            if (freeTrialUsed) return; // Block re-activation
            await activateFreeTrial();
            navigate('/');
            return;
        }

        // Paid plan — Razorpay checkout
        const razorpayPlanId = RAZORPAY_PLAN_IDS[planId];
        if (!razorpayPlanId) {
            alert(`Plan "${planId}" is not yet available. Coming soon!`);
            return;
        }

        if (!isRazorpayLoaded) {
            alert('Payment SDK is loading. Please try again in a moment.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create subscription via backend
            const data = await createSubscription(razorpayPlanId);
            const { subscription_id } = data;

            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                subscription_id,
                name: 'Trade Journal Pro',
                description: planId === 'monthly' ? 'Monthly Subscription — ₹499/mo' : 'Yearly Subscription',
                theme: { color: '#F59E0B' },
                handler: async (response: any) => {
                    try {
                        // Razorpay handler only fires on successful payment
                        // Write subscription to Firestore FIRST to ensure user gets access
                        if (currentUser) {
                            await setDoc(doc(db, 'artifacts', 'default-app-id', 'subscriptions', currentUser.uid), {
                                plan: planId,
                                status: 'active',
                                razorpaySubscriptionId: response.razorpay_subscription_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                startedAt: new Date().toISOString(),
                            });
                        }

                        // Refresh subscription status so guards know we're subscribed
                        await refreshSubscription();

                        // Try backend verification (non-blocking — subscription already activated)
                        try {
                            await verifyPayment({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                        } catch (verifyErr) {
                            console.warn('Backend verification failed (subscription still active):', verifyErr);
                        }

                        alert('Subscription activated successfully! 🎉');
                        navigate('/');
                    } catch (err) {
                        console.error('Subscription activation failed:', err);
                        alert('Something went wrong activating your subscription. Please contact support.');
                    }
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err: any) {
            console.error('Subscription error:', err);
            alert(`Failed to start subscription: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-100">
            {/* ───────── NAV BAR ───────── */}
            <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#0B1120]/70 border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                    <Link to="/home" className="flex items-center gap-2 group">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-gray-900 font-black text-sm shadow-lg shadow-amber-500/20">
                            T
                        </span>
                        <span className="text-lg font-bold tracking-tight">
                            Trade Journal{' '}
                            <span className="text-amber-400">Pro</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {currentUser ? (
                            <ProfileDropdown />
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-5 py-2 text-sm font-semibold rounded-lg border border-gray-600 hover:border-gray-400 transition-all duration-200 hover:bg-white/5"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 hover:scale-[1.03]"
                                >
                                    Start Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Page content with top padding for fixed nav */}
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                {/* Background glow */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-500/[0.05] rounded-full blur-[140px]" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[100px]" />
                </div>

                {/* Header */}
                <div className="max-w-5xl mx-auto text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold mb-6 tracking-wide">
                        <Star size={14} /> CHOOSE YOUR PLAN
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                        Choose Your{' '}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            Plan
                        </span>
                    </h1>
                    <p className="mt-4 text-gray-400 max-w-xl mx-auto text-base md:text-lg">
                        Start free for 2 weeks. Upgrade anytime for unlimited access to all features.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl border flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.highlight
                                ? 'border-amber-500/50 bg-gradient-to-b from-amber-900/20 via-[#151F32] to-[#151F32] ring-1 ring-amber-500/20 scale-[1.04] md:scale-105 shadow-2xl shadow-amber-500/10 py-10 px-7'
                                : 'border-white/[0.08] bg-[#151F32] py-8 px-6'
                                }`}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 tracking-wide shadow-lg shadow-amber-500/30">
                                    {plan.badge}
                                </span>
                            )}

                            {/* Icon & Name */}
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.highlight
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-white/5 text-gray-400'
                                        }`}
                                >
                                    <plan.icon size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{plan.name}</h3>
                                    <p className="text-xs text-gray-500">{plan.tagline}</p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className={`font-extrabold ${plan.highlight ? 'text-4xl' : 'text-3xl'}`}>
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className="text-sm text-gray-400 font-normal">
                                            {plan.period}
                                        </span>
                                    )}
                                </div>

                                {/* Monthly breakdown for yearly */}
                                {plan.monthly && (
                                    <p className="mt-2 text-lg font-semibold text-amber-400">
                                        {plan.monthly}{' '}
                                        <span className="text-sm font-normal text-gray-500">
                                            (billed yearly)
                                        </span>
                                    </p>
                                )}

                                {/* Strikethrough old price */}
                                {plan.oldPrice && (
                                    <p className="mt-1 text-sm text-gray-500 line-through">
                                        {plan.oldPrice}
                                    </p>
                                )}

                                {/* Savings */}
                                {plan.savings && (
                                    <span className="mt-2 inline-block px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                        {plan.savings}
                                    </span>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feat) => (
                                    <li key={feat.text} className="flex items-start gap-2.5 text-sm">
                                        {feat.included ? (
                                            <Check size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                                        ) : (
                                            <X size={16} className="text-gray-600 mt-0.5 shrink-0" />
                                        )}
                                        <span className={feat.included ? 'text-gray-300' : 'text-gray-600'}>
                                            {feat.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button
                                onClick={() => handleSelect(plan.id)}
                                disabled={loading || (subscriptionData?.plan === plan.id && hasActiveSubscription) || (plan.id === 'free' && isFreePlanDisabled)}
                                className={`group w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${(subscriptionData?.plan === plan.id && hasActiveSubscription)
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : (plan.id === 'free' && isFreePlanDisabled)
                                        ? 'bg-gray-800 text-gray-500 border border-gray-700'
                                        : plan.ctaStyle
                                    }`}
                            >
                                {loading
                                    ? 'Processing...'
                                    : (subscriptionData?.plan === plan.id && hasActiveSubscription)
                                        ? 'Current Plan'
                                        : (plan.id === 'free' && isFreePlanDisabled)
                                            ? 'Trial Used'
                                            : plan.cta
                                }
                                {!loading && !(subscriptionData?.plan === plan.id && hasActiveSubscription) && (
                                    <ArrowRight
                                        size={16}
                                        className="transition-transform group-hover:translate-x-1"
                                    />
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Plan Comparison Note */}
                <div className="max-w-2xl mx-auto mt-14 text-center">
                    <p className="text-sm text-gray-500">
                        All paid plans include a 7-day money-back guarantee. Cancel anytime from your settings.
                    </p>

                    {!currentUser && (
                        <p className="mt-4 text-sm text-gray-400">
                            Already have an account?{' '}
                            <a href="/login" className="text-amber-400 hover:underline font-medium">
                                Log in
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
