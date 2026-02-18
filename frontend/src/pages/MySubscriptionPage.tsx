import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    CreditCard,
    Calendar,
    Clock,
    IndianRupee,
    RefreshCw,
    AlertTriangle,
    ArrowUpRight,
    Crown,
    Zap,
    Shield,
} from 'lucide-react';

/* ─── Helpers ─── */
const toDate = (raw?: string | any): Date | null => {
    if (!raw) return null;
    try {
        return raw.toDate ? raw.toDate() : new Date(raw);
    } catch {
        return null;
    }
};

const formatDate = (raw?: string | any): string => {
    const d = toDate(raw);
    if (!d) return '—';
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

/** Compute expiry date from startedAt + plan when expiresAt is not stored */
const computeExpiryDate = (startedAt?: string | any, plan?: string): Date | null => {
    const start = toDate(startedAt);
    if (!start) return null;
    const expiry = new Date(start);
    switch (plan) {
        case 'monthly':
            expiry.setMonth(expiry.getMonth() + 1);
            break;
        case 'yearly':
            expiry.setFullYear(expiry.getFullYear() + 1);
            break;
        case 'free':
            expiry.setDate(expiry.getDate() + 7);
            break;
        default:
            return null;
    }
    return expiry;
};

const planLabel = (plan?: string): string => {
    switch (plan) {
        case 'monthly':
            return 'Monthly Plan';
        case 'yearly':
            return 'Yearly Plan';
        case 'free':
            return 'Free Trial';
        default:
            return plan || 'Unknown';
    }
};

const planAmount = (plan?: string): string => {
    switch (plan) {
        case 'monthly':
            return '₹499 / month';
        case 'yearly':
            return '₹4,790 / year';
        case 'free':
            return '₹0 (Free)';
        default:
            return '—';
    }
};

const PlanIcon = ({ plan }: { plan?: string }) => {
    switch (plan) {
        case 'yearly':
            return <Crown size={20} className="text-amber-400" />;
        case 'monthly':
            return <Zap size={20} className="text-blue-400" />;
        default:
            return <Shield size={20} className="text-gray-400" />;
    }
};

/* ─── Page ─── */
export const MySubscriptionPage = () => {
    const { hasActiveSubscription, subscriptionData } = useAuth();
    const navigate = useNavigate();

    const isActive = hasActiveSubscription && subscriptionData?.status === 'active';

    // Resolve expiry: use stored expiresAt, or compute from startedAt + plan
    const resolvedExpiry = subscriptionData?.expiresAt
        || computeExpiryDate(subscriptionData?.startedAt, subscriptionData?.plan);
    const resolvedNextBilling = subscriptionData?.plan === 'free'
        ? null
        : resolvedExpiry;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                    <CreditCard size={20} className="text-amber-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">My Subscription</h1>
                    <p className="text-xs text-gray-500">Manage your subscription plan</p>
                </div>
            </div>

            {/* ─── Active Subscription Card ─── */}
            {isActive && subscriptionData ? (
                <Card className="border-gray-700 !p-0 overflow-hidden">
                    {/* Card Header */}
                    <div className="px-5 py-4 border-b border-gray-700/60 flex items-center justify-between bg-gradient-to-r from-emerald-900/20 to-transparent">
                        <div className="flex items-center gap-3">
                            <PlanIcon plan={subscriptionData.plan} />
                            <div>
                                <p className="text-base font-bold text-white">
                                    {planLabel(subscriptionData.plan)}
                                </p>
                                <p className="text-xs text-gray-400">Current active plan</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                        </span>
                    </div>

                    {/* Card Body — Info Grid */}
                    <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Start Date */}
                        <InfoRow
                            icon={<Calendar size={16} className="text-gray-500" />}
                            label="Start Date"
                            value={formatDate(subscriptionData.startedAt)}
                        />

                        {/* Expiry Date */}
                        <InfoRow
                            icon={<Clock size={16} className="text-gray-500" />}
                            label="Expiry Date"
                            value={formatDate(resolvedExpiry)}
                        />

                        {/* Next Billing Date */}
                        <InfoRow
                            icon={<Calendar size={16} className="text-gray-500" />}
                            label="Next Billing Date"
                            value={
                                subscriptionData.plan === 'free'
                                    ? 'N/A'
                                    : formatDate(resolvedNextBilling)
                            }
                        />

                        {/* Amount */}
                        <InfoRow
                            icon={<IndianRupee size={16} className="text-gray-500" />}
                            label="Amount"
                            value={planAmount(subscriptionData.plan)}
                        />
                    </div>

                    {/* Card Footer */}
                    {subscriptionData.plan !== 'free' && (
                        <div className="px-5 py-3 border-t border-gray-700/60 bg-[#0e1726]">
                            <Button
                                variant="danger"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    const confirmed = window.confirm(
                                        'Are you sure you want to cancel your subscription? You will retain access until the current billing period ends.'
                                    );
                                    if (confirmed) {
                                        alert(
                                            'Please contact support to cancel your subscription. We are working on in-app cancellation.'
                                        );
                                    }
                                }}
                            >
                                <AlertTriangle size={14} className="mr-2" />
                                Cancel Subscription
                            </Button>
                        </div>
                    )}
                </Card>
            ) : (
                /* ─── Inactive Card ─── */
                <Card className="border-gray-700 !p-0 overflow-hidden">
                    {/* Card Header */}
                    <div className="px-5 py-4 border-b border-gray-700/60 flex items-center justify-between bg-gradient-to-r from-red-900/20 to-transparent">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-gray-500" />
                            <div>
                                <p className="text-base font-bold text-white">No Active Plan</p>
                                <p className="text-xs text-gray-400">Subscribe to unlock all features</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Inactive
                        </span>
                    </div>

                    {/* Card Body */}
                    <div className="px-5 py-8 text-center">
                        <p className="text-gray-400 text-sm mb-6">
                            You do not have an active subscription. Upgrade now to unlock unlimited trades, detailed reports, and more.
                        </p>
                        <Button
                            variant="primary"
                            className="mx-auto"
                            onClick={() => navigate('/subscription')}
                        >
                            Upgrade Now
                            <ArrowUpRight size={14} className="ml-2" />
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

/* ─── Reusable Info Row ─── */
const InfoRow = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-white">{typeof value === 'string' ? value : value}</p>
        </div>
    </div>
);
