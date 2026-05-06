import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Call Login API
            const response = await api.post('/auth/login', { Phone: phone, Password: password });
            const { token, user } = response.data;

            // Get Role (ensure consistency between uppercase/lowercase from API)
            const userRole = user.Role || user.role;

            // Block access if not in specified Roles
            if (!['Parent', 'Kitchen', 'Admin', 'Teacher'].includes(userRole)) {
                setError('This account does not have access to the system.');
                setLoading(false);
                return;
            }

            // Store Token for subsequent API calls
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // 2. ROLE-BASED NAVIGATION LOGIC
            if (userRole === 'Parent') {
                // --- PARENT LOGIC ---
                const parentId = user.UserID || user.id;
                try {
                    const studentRes = await api.get(`/students/parent/${parentId}`);
                    const students = studentRes.data.data;

                    if (students && students.length > 0) {
                        const firstStudent = students[0];

                        // Check: If Height is missing OR HealthProfileCompleted = false
                        if (!firstStudent.Height || firstStudent.Height <= 0 || firstStudent.HealthProfileCompleted === false) {
                            navigate('/onboarding');
                            return; // Stop here, don't proceed to Dashboard
                        }
                    }
                } catch (err) {
                    console.error("Error checking student status", err);
                }
                // If updated, go to Parent Dashboard
                navigate('/parent/dashboard');

            } else if (userRole === 'Kitchen') {
                // --- KITCHEN: REDIRECT TO KITCHEN DASHBOARD ---
                navigate('/kitchen/dashboard');

            } else if (userRole === 'Admin') {
                // --- ADMIN: REDIRECT TO ADMIN DASHBOARD ---
                navigate('/admin/dashboard');
            } else if (userRole === 'Teacher') {
                // --- TEACHER: REDIRECT TO STUDENT MANAGEMENT ---
                navigate('/admin/students');
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Incorrect phone number or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">

                {/* --- LOGO AREA --- */}
                <div className="flex justify-center mb-8 mt-2">
                    <div className="w-32 h-32 bg-white border-4 border-white shadow-sm rotate-45 overflow-hidden flex items-center justify-center rounded">
                        <div className="min-w-full min-h-full flex items-center justify-center">
                            <img
                                src="/logo.jpg"
                                alt="Tran Dai Nghia Primary School Logo"
                                className="w-11/12 h-11/12 object-cover"
                            />
                        </div>
                    </div>
                </div>
                {/* --- LOGO END --- */}

                <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-900">
                    <span className="block">Meal Management Portal</span>
                    <span className="block">Tran Dai Nghia Primary School</span>
                </h2>

            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                {/* Card-based Layout */}
                <div className="bg-white py-8 px-4 shadow-sm sm:rounded sm:px-10 border border-pink-100">
                    <form className="space-y-6" onSubmit={handleLogin}>

                        {error && (
                            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Phone Number / Username
                            </label>
                            <div className="mt-1">
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 sm:text-sm transition-colors"
                                    placeholder="Example: 0901234567 or gv01"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 sm:text-sm transition-colors"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-gray-900 bg-yellow-300 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Processing...' : 'Login'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}