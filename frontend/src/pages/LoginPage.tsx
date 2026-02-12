
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const LoginPage = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, convertMobileToEmail } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const email = convertMobileToEmail(mobile);
            console.log("Attempting login with:", email);
            await login(mobile, password);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid mobile number or password.');
            } else {
                setError('Failed to log in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-gray-800 border-gray-700">
            <h2 className="text-3xl font-bold text-center text-white mb-6">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Mobile Number"
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button type="submit" loading={loading} className="w-full bg-blue-600 hover:bg-blue-500">
                    Login
                </Button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-400 hover:underline">
                    Sign Up
                </Link>
            </p>
        </Card>
    );
};
