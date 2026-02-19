
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/context/AuthContext';
import { DataProvider } from './features/trading/context/DataContext';

import { MainLayout } from './layout/layouts/MainLayout';
import { AuthLayout } from './features/auth/layouts/AuthLayout';

import { HomePage } from './landing/pages/HomePage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { GoldPage } from './features/trading/pages/GoldPage';
import { SilverPage } from './features/trading/pages/SilverPage';
import { ReportPage } from './features/reports/pages/ReportPage';
import { WeeklyReport } from './features/reports/components/WeeklyReport';
import { MonthlyReport } from './features/reports/components/MonthlyReport';
import { TradeHistory } from './features/reports/components/TradeHistory';
import { InstrumentAnalysis } from './features/reports/components/InstrumentAnalysis';
import { WinLossAnalysis } from './features/reports/components/WinLossAnalysis';
import { ProfilePage } from './features/profile/pages/ProfilePage';
import { SettingsPage } from './features/trading/pages/SettingsPage';
import { SubscriptionPage } from './features/subscription/pages/SubscriptionPage';
import { MySubscriptionPage } from './features/subscription/pages/MySubscriptionPage';

// Protected Route Wrapper — requires authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

// Subscription Guard — redirects to /subscription if no active plan
const SubscriptionGuard = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, hasActiveSubscription } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/home" replace />;
  }

  if (!hasActiveSubscription) {
    return <Navigate to="/subscription" replace />;
  }

  return <>{children}</>;
};

// Public Route Wrapper (redirects to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/home" element={<PublicRoute><HomePage /></PublicRoute>} />

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            </Route>

            {/* Subscription Page — requires auth but NOT active subscription */}
            <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />

            {/* Protected Routes — requires auth AND active subscription */}
            <Route element={<SubscriptionGuard><MainLayout /></SubscriptionGuard>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/gold" element={<GoldPage />} />
              <Route path="/silver" element={<SilverPage />} />
              <Route path="/report" element={<ReportPage />}>
                <Route index element={<Navigate to="history" replace />} />
                <Route path="weekly" element={<WeeklyReport />} />
                <Route path="monthly" element={<MonthlyReport />} />
                <Route path="history" element={<TradeHistory />} />
                <Route path="instrument" element={<InstrumentAnalysis />} />
                <Route path="win-loss" element={<WinLossAnalysis />} />
              </Route>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/my-subscription" element={<MySubscriptionPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
