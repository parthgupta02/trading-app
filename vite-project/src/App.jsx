
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { GoldPage } from './pages/GoldPage';
import { SilverPage } from './pages/SilverPage';
import { ReportPage } from './pages/ReportPage';
import { ProfilePage } from './pages/ProfilePage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Wrapper (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/gold" element={<GoldPage />} />
              <Route path="/silver" element={<SilverPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
