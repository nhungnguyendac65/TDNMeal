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
            // 1. Gọi API Đăng nhập
            const response = await api.post('/auth/login', { Phone: phone, Password: password });
            const { token, user } = response.data;

            // Lấy Role (phòng hờ API trả về chữ hoa hay chữ thường)
            const userRole = user.Role || user.role;

            // Chặn nếu không thuộc các Role quy định
            if (!['Parent', 'Kitchen', 'Admin', 'Teacher'].includes(userRole)) {
                setError('Tài khoản này không có quyền truy cập hệ thống.');
                setLoading(false);
                return;
            }

            // Lưu Token để dùng cho các API tiếp theo
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // 2. PHÂN LUỒNG LOGIC TÙY THEO ROLE
            if (userRole === 'Parent') {
                // --- LOGIC CHUẨN CỦA PHỤ HUYNH (GIỮ NGUYÊN) ---
                const parentId = user.UserID || user.id;
                try {
                    const studentRes = await api.get(`/students/parent/${parentId}`);
                    const students = studentRes.data.data;

                    if (students && students.length > 0) {
                        const firstStudent = students[0];

                        // Kiểm tra: Nếu chưa có Chiều cao HOẶC HealthProfileCompleted = false
                        if (!firstStudent.Height || firstStudent.Height <= 0 || firstStudent.HealthProfileCompleted === false) {
                            navigate('/onboarding');
                            return; // Dừng tại đây, không chạy xuống Dashboard
                        }
                    }
                } catch (err) {
                    console.error("Lỗi khi kiểm tra trạng thái học sinh", err);
                }
                // Nếu đã cập nhật rồi, cho vào Dashboard Phụ huynh
                navigate('/parent/dashboard');

            } else if (userRole === 'Kitchen') {
                // --- NẾU LÀ BẾP: BAY THẲNG VÀO DASHBOARD BẾP ---
                navigate('/kitchen/dashboard');

            } else if (userRole === 'Admin') {
                // --- NẾU LÀ ADMIN: BAY THẲNG VÀO DASHBOARD ADMIN ---
                navigate('/admin/dashboard');
            } else if (userRole === 'Teacher') {
                // --- NẾU LÀ GIÁO VIÊN: VÀO THẲNG QUẢN LÝ HỌC SINH ---
                navigate('/admin/students');
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Sai số điện thoại hoặc mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">

                {/* --- KHU VỰC LOGO: ĐÃ FIX LỖI TAM GIÁC VÀ ÉP VỪA KHUNG --- */}
                <div className="flex justify-center mb-8 mt-2">
                    {/* BƯỚC 1: Khung hình thoi (w-32 h-32 cho to ra một chút), viền trắng, bo góc nhẹ */}
                    <div className="w-32 h-32 bg-white border-4 border-white shadow-sm rotate-45 overflow-hidden flex items-center justify-center rounded">

                        {/* BƯỚC 2: Container lồng bên trong - không xoay, để ảnh xoay theo khung ngoài */}
                        <div className="min-w-full min-h-full flex items-center justify-center">
                            {/* Thu nhỏ ảnh để vừa khít trong khung trắng và cho nó quay thành hình thoi */}
                            <img
                                src="/logo.jpg"
                                alt="Logo Trường Trần Đại Nghĩa"
                                className="w-11/12 h-11/12 object-cover"
                            />
                        </div>
                    </div>
                </div>
                {/* --- KẾT THÚC CỤM LOGO --- */}

                <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-900">
                    <span className="block">Trang quản lý bữa ăn</span>
                    <span className="block">Trường Tiểu học Trần Đại Nghĩa</span>
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
                                Số điện thoại / Tên đăng nhập
                            </label>
                            <div className="mt-1">
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 sm:text-sm transition-colors"
                                    placeholder="Ví dụ: 0901234567 hoặc gv01"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Mật khẩu
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
                                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}