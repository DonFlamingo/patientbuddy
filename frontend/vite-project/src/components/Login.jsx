import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login({ onLoginSuccess, onLoginFailure }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoadingRegular, setIsLoadingRegular] = useState(false);
    const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (isAdminLogin = false) => {
        if (isAdminLogin) {
            setIsLoadingAdmin(true);
        } else {
            setIsLoadingRegular(true);
        }
        setError('');

        try {
            const response = await fetch('http://142.93.195.191:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                // First set the user and auth state
                await new Promise(resolve => {
                    onLoginSuccess(data.user);
                    setTimeout(resolve, 100); // Give React time to update state
                });
                
                if (isAdminLogin) {
                    if (data.user.role === 'admin') {
                        navigate('/admin', { replace: true });
                    } else {
                        setError('Only admins can use this sign-in option.');
                        localStorage.removeItem('token');
                        onLoginFailure();
                    }
                } else {
                    navigate('/', { replace: true });
                }
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            if (isAdminLogin) {
                setIsLoadingAdmin(false);
            } else {
                setIsLoadingRegular(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                        <span className="text-pink-600">Patient</span>Buddy
                    </h1>
                    <h2 className="mt-6 text-2xl font-bold text-gray-900">Sign in to your account</h2>
                </div>
                <form className="mt-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button
                            type="button"
                            disabled={isLoadingRegular || isLoadingAdmin}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                            onClick={() => handleLogin(false)}
                        >
                            {isLoadingRegular ? 'Signing in...' : 'Sign in'}
                        </button>
                        <button
                            type="button"
                            disabled={isLoadingRegular || isLoadingAdmin}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            onClick={() => handleLogin(true)}
                        >
                            {isLoadingAdmin ? 'Signing in as Admin...' : 'Sign in as Admin'}
                        </button>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-medium text-pink-600 hover:text-pink-500">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
