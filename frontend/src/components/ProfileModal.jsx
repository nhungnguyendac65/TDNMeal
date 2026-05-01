import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ProfileModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (isOpen) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setFormData({
          fullName: user.fullName || user.FullName || '',
          phone: user.phone || user.Phone || user.username || '', 
          password: '' 
        });
      }
      setMessage({ text: '', type: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      console.log("Đang gửi dữ liệu cập nhật:", {
        FullName: formData.fullName,
        Phone: formData.phone,
        Password: formData.password ? '******' : '(không đổi)'
      });

      const res = await api.put('/auth/profile', {
        FullName: formData.fullName,
        Phone: formData.phone,
        Password: formData.password
      });

      console.log("Kết quả từ Server:", res.data);

      setMessage({ text: 'Chúc mừng! Cập nhật mật khẩu và hồ sơ thành công.', type: 'success' });
      
      // Cập nhật lại localStorage với đầy đủ thông tin mới nhất
      const currentUser = JSON.parse(localStorage.getItem('user')) || {};
      const updatedUser = { 
        ...currentUser, 
        fullName: res.data.user.fullName || res.data.user.FullName || currentUser.fullName, 
        phone: res.data.user.phone || res.data.user.Phone || currentUser.phone,
        username: res.data.user.username || res.data.user.Username || currentUser.username
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log("Đã cập nhật LocalStorage:", updatedUser);
      
      // Bắn sự kiện để các Component khác biết mà load lại tên hiển thị (nếu có)
      window.dispatchEvent(new Event('userUpdated'));

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error("LỖI CẬP NHẬT HỒ SƠ:", err);
      const errorMsg = err.response?.data?.message || 'Lỗi kết nối server hoặc dữ liệu không hợp lệ.';
      setMessage({ 
        text: errorMsg, 
        type: 'error' 
      });
      // Nếu là lỗi 401 thì có thể token hết hạn
      if (err.response?.status === 401) {
        alert("Phiên làm việc hết hạn, vui lòng đăng nhập lại.");
        localStorage.clear();
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-md w-full max-w-md shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Thay đổi mật khẩu</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message.text && (
            <div className={`p-3 rounded text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Họ và Tên</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại / Tên đăng nhập</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu mới</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu mới tại đây"
              className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">Để trống nếu bạn chỉ muốn cập nhật tên hoặc số điện thoại.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang lưu...' : 'Cập nhật ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
