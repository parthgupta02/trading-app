
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const RegisterPage = () => {
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (fullName.trim() === '') {
            setError('Please enter your full name.');
            return;
        }
        if (!/^\d{10}$/.test(mobile)) {
            setError('Mobile Number must be 10 digits.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            await register(fullName, mobile, password);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This mobile number is already taken.');
            } else {
                setError('Failed to create account.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-gray-800 border-gray-700">
            <h2 className="text-3xl font-bold text-center text-white mb-6">Create Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Full Name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                />
                <Input
                    label="Mobile Number"
                    type="tel"
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button type="submit" loading={loading} variant="success" className="w-full">
                    Create Account
                </Button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-400 hover:underline">
                    Login
                </Link>
            </p>
        </Card>
    );
};
