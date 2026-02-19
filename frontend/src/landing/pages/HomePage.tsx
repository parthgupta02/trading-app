import { Link } from 'react-router-dom';
import {
    TrendingUp,
    Calculator,
    CalendarCheck,
    FileBarChart,
    ArrowRight,
    Shield,
    Zap,
    Star,
} from 'lucide-react';

/* ─── Feature Card Data ─── */
const features = [
    {
        icon: TrendingUp,
        title: 'Add Buy / Sell Trades',
        desc: 'Quickly log Gold Mini & Silver Mini trades with a clean, intuitive form.',
        color: 'from-amber-500/20 to-amber-600/5',
        iconColor: 'text-amber-400',
    },
    {
        icon: Calculator,
        title: 'Automatic P&L Calculation',
        desc: 'Instant profit & loss computation on every trade — no manual math.',
        color: 'from-emerald-500/20 to-emerald-600/5',
        iconColor: 'text-emerald-400',
    },
    {
        icon: CalendarCheck,
        title: 'Weekly Settlement System',
        desc: 'Auto-settle open positions every week to keep your books clean.',
        color: 'from-blue-500/20 to-blue-600/5',
        iconColor: 'text-blue-400',
    },
    {
        icon: FileBarChart,
        title: 'Trade History & Reports',
        desc: 'Detailed trade logs, weekly & monthly reports, and instrument analysis.',
        color: 'from-purple-500/20 to-purple-600/5',
        iconColor: 'text-purple-400',
    },
];

/* ─── Pricing Preview Data ─── */
const plans = [
    {
        name: 'Free Plan',
        price: '₹0',
        period: 'for 1 week',
        icon: Shield,
        color: 'border-gray-600',
        bg: 'bg-gray-800/40',
        badge: null,
    },
    {
        name: 'Monthly Plan',
        price: '₹499',
        period: '/month',
        icon: Zap,
        color: 'border-blue-500/40',
        bg: 'bg-blue-900/20',
        badge: null,
    },
    {
        name: 'Yearly Plan',
        price: '₹4,790',
        period: '/year',
        icon: Star,
        color: 'border-amber-500/60',
        bg: 'bg-amber-900/15',
        badge: 'Recommended',
    },
];

export const HomePage = () => {
    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-100 overflow-x-hidden">
            {/* ───────── NAV BAR ───────── */}
            <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#0B1120]/70 border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                    <Link to="/home" className="flex items-center gap-2 group">
                        <img src="/icons/icon-192.webp" alt="Logo" className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-amber-500/20" />
                        <span className="text-lg font-bold tracking-tight">
                            Trade Journal{' '}
                            <span className="text-amber-400">Pro</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
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
                    </div>
                </div>
            </nav>

            {/* ───────── HERO SECTION ───────── */}
            <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
                {/* Background glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-500/[0.07] rounded-full blur-[120px]" />
                    <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[100px]" />
                </div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold mb-8 tracking-wide">
                        <Zap size={14} /> BUILT FOR MCX TRADERS
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                        Track Trades.{' '}
                        <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                            Control Risk.
                        </span>
                        <br />
                        Grow Smarter.
                    </h1>

                    <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        The simplest way to journal your Gold Mini &amp; Silver Mini trades, auto-calculate P&amp;L, and settle weekly — all in one place.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/register"
                            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:scale-[1.03]"
                        >
                            Start Free
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-xl border border-gray-600 hover:border-gray-400 hover:bg-white/5 transition-all duration-300"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* ───────── FEATURES SECTION ───────── */}
            <section id="features" className="relative py-20 md:py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Everything you need to{' '}
                            <span className="text-amber-400">manage trades</span>
                        </h2>
                        <p className="mt-3 text-gray-400 max-w-xl mx-auto">
                            No clutter. No complexity. Just the tools that matter for MCX commodity traders.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className={`group relative rounded-2xl border border-white/[0.06] bg-gradient-to-b ${f.color} p-6 hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1`}
                            >
                                <div
                                    className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${f.iconColor}`}
                                >
                                    <f.icon size={22} />
                                </div>
                                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───────── PRICING PREVIEW ───────── */}
            <section id="pricing" className="relative py-20 md:py-28 px-6">
                {/* Subtle glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/[0.04] rounded-full blur-[100px]" />
                </div>

                <div className="relative max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Simple, transparent{' '}
                            <span className="text-amber-400">pricing</span>
                        </h2>
                        <p className="mt-3 text-gray-400 max-w-xl mx-auto">
                            Start free for a week. Upgrade when you're ready.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
                        {plans.map((p) => (
                            <div
                                key={p.name}
                                className={`relative rounded-2xl border ${p.color} ${p.bg} p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${p.badge ? 'ring-1 ring-amber-500/30' : ''
                                    }`}
                            >
                                {p.badge && (
                                    <span className="absolute -top-3 px-3 py-0.5 text-[11px] font-bold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 tracking-wide shadow-lg">
                                        {p.badge}
                                    </span>
                                )}
                                <p.icon
                                    size={28}
                                    className={`mb-3 ${p.badge ? 'text-amber-400' : 'text-gray-400'
                                        }`}
                                />
                                <h3 className="font-bold text-sm mb-1">{p.name}</h3>
                                <p className="text-2xl font-extrabold">
                                    {p.price}
                                    <span className="text-xs font-normal text-gray-400">
                                        {' '}
                                        {p.period}
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>


                </div>
            </section>

            {/* ───────── FOOTER ───────── */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/icons/icon-192.webp" alt="Logo" className="w-7 h-7 rounded-md object-cover" />
                        <span className="font-bold text-sm">
                            Trade Journal <span className="text-amber-400">Pro</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-300 transition-colors">
                            About
                        </a>
                        <a href="#" className="hover:text-gray-300 transition-colors">
                            Contact
                        </a>
                        <a href="#" className="hover:text-gray-300 transition-colors">
                            Terms &amp; Privacy
                        </a>
                    </div>

                    <p className="text-xs text-gray-600">
                        &copy; {new Date().getFullYear()} Trade Journal Pro. All rights
                        reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};
