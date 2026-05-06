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
      console.log("Sending update data:", {
        FullName: formData.fullName,
        Phone: formData.phone,
        Password: formData.password ? '******' : '(unchanged)'
      });

      const res = await api.put('/auth/profile', {
        FullName: formData.fullName,
        Phone: formData.phone,
        Password: formData.password
      });

      console.log("Server response:", res.data);

      setMessage({ text: 'Congratulations! Profile and password updated successfully.', type: 'success' });
      
      // Update localStorage with new info
      const currentUser = JSON.parse(localStorage.getItem('user')) || {};
      const updatedUser = { 
        ...currentUser, 
        fullName: res.data.user.fullName || res.data.user.FullName || currentUser.fullName, 
        phone: res.data.user.phone || res.data.user.Phone || currentUser.phone,
        username: res.data.user.username || res.data.user.Username || currentUser.username
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log("LocalStorage updated:", updatedUser);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('userUpdated'));

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error("PROFILE UPDATE ERROR:", err);
      const errorMsg = err.response?.data?.message || 'Server connection error or invalid data.';
      setMessage({ 
        text: errorMsg, 
        type: 'error' 
      });
      // If 401, token might be expired
      if (err.response?.status === 401) {
        alert("Session expired, please login again.");
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
          <h2 className="text-lg font-bold text-slate-800">Update Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message.text && (
            <div className={`p-3 rounded text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
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
            <label className="block text-sm font-bold text-slate-700 mb-1">Phone / Username</label>
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
            <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password here"
              className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">Leave blank if you only want to update name or phone.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Update Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
