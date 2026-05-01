import React, { useState, useEffect } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CheckCircle, AlertCircle, Clock, CreditCard,
  Shield, Bell, LayoutDashboard, GraduationCap,
  Utensils, LogOut, ChevronRight, X, AlertTriangle
 , User } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../../services/api';

const pieColors = ['#c7d2fe', '#fbcfe8'];

export default function AdminDashboard() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rejectModal, setRejectModal] = useState({ show: false, menuId: null, reason: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/login');
        return;
      }
      setCurrentUser(JSON.parse(storedUser));

      try {
        const response = await api.get('/admin/stats');
        setStats(response.data.data);
      } catch (error) {
        console.error('Lỗi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const handleUserUpdate = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, [navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn duyệt thực đơn này?")) return;
    try {
      await api.put(`/menus/${id}`, { status: 'Approved' });
      showToast("Đã duyệt thực đơn!");
      // Reload stats
      const response = await api.get('/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      showToast("Lỗi cập nhật trạng thái", "error");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) {
      alert("Vui lòng nhập lý do từ chối!");
      return;
    }
    try {
      await api.put(`/menus/${rejectModal.menuId}`, {
        status: 'Rejected',
        rejectReason: rejectModal.reason
      });
      showToast("Đã từ chối thực đơn!");
      setRejectModal({ show: false, menuId: null, reason: '' });
      // Reload stats
      const response = await api.get('/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      showToast("Lỗi cập nhật trạng thái", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-semibold text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 flex  text-gray-800">

      {/* SIDEBAR */}
      <aside
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-gray-100 hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 z-50 ${isSidebarExpanded ? 'w-64 shadow-sm' : 'w-20'}`}
      >
        <div className="p-6 border-b border-gray-50 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shrink-0 shadow-sm"><Shield size={20} /></div>
          <span className={`font-bold text-lg tracking-tight text-gray-900 transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>ADMIN PORTAL</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-hidden">
          <NavItem icon={LayoutDashboard} label="Tổng quan" active expanded={isSidebarExpanded} />
          <NavItem icon={Users} label="Người dùng" expanded={isSidebarExpanded} onClick={() => navigate('/admin/users')} />
          <NavItem icon={GraduationCap} label="Học sinh" expanded={isSidebarExpanded} onClick={() => navigate('/admin/students')} />
          <NavItem icon={Utensils} label="Thực đơn" expanded={isSidebarExpanded} onClick={() => navigate('/admin/menus')} />
          <NavItem icon={CreditCard} label="Thanh toán" expanded={isSidebarExpanded} onClick={() => navigate('/admin/payments')} />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pb-12">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-gray-400 text-sm hidden md:block">Trường Tiểu học Trần Đại Nghĩa</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={18} /></button>
            
            <div className="relative group cursor-pointer pb-2 -mb-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-sm transition-transform group-hover:scale-105">
                  <User size={16} />
                </span>
              </div>
              
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] transform origin-top-right translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-md">
                  <p className="text-[13px] font-bold text-slate-800">Tài khoản</p>
                </div>
                <div className="p-1.5">
                  <button onClick={() => setIsProfileModalOpen(true)} className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors font-semibold">Thay đổi mật khẩu</button>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded transition-colors font-bold mt-1">Đăng xuất</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm font-medium mt-1">Giám sát suất ăn, phê duyệt và an toàn học sinh.</p>
            </div>
            <div className="bg-white px-4 py-2.5 rounded border border-gray-200 shadow-sm text-sm font-semibold text-gray-600 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              Hôm nay: {new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard label="Học sinh đăng ký" value={stats?.studentCount || 0} color="indigo" icon={Users} />
            <StatCard label="Suất ăn hôm nay" value={stats?.mealsToday || 0} color="indigo" icon={Utensils} />
            <StatCard label="Chờ phê duyệt" value={stats?.pendingMenuCount || 0} color="yellow" icon={CheckCircle} alert={stats?.pendingMenuCount > 0} />
            <StatCard label="Chưa thanh toán" value={stats?.unpaidCount || 0} color="yellow" icon={CreditCard} />
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-md p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-6">Xu hướng suất ăn (Tuần này)</h3>
              <div className="h-64">
                {stats?.barData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="meals" fill="#c7d2fe" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">Chưa có dữ liệu</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Phân bổ loại thực đơn</h3>
              <div className="flex-1 min-h-[200px] flex items-center justify-center">
                {stats?.pieData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.pieData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                        {stats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-gray-400">Chưa có dữ liệu thống kê</div>
                )}
              </div>
              {stats?.pieData?.length > 0 && (
                <div className="flex justify-center space-x-6 mt-4">
                  {stats.pieData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center text-xs font-medium text-gray-600">
                      <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: pieColors[i % pieColors.length] }}></span>
                      {entry.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 items-start">
            {/* PENDING MENUS */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  Thực đơn chờ phê duyệt
                </h3>
                {stats?.pendingMenuCount > 4 && (
                  <button onClick={() => navigate('/admin/menus')} className="text-indigo-600 text-xs font-semibold hover:underline">
                    Xem tất cả ({stats.pendingMenuCount})
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {stats?.pendingMenus?.length > 0 ? (
                  stats.pendingMenus.map((menu) => (
                    <div key={menu.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Ngày: {new Date(menu.date).toLocaleDateString('vi-VN')}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Trạng thái: <span className="text-yellow-600">Chờ duyệt</span></p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleApprove(menu.id)}
                          className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm transition-colors"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => setRejectModal({ show: true, menuId: menu.id, reason: '' })}
                          className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-gray-400 italic">
                    Không có thực đơn nào đang chờ duyệt.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* REJECT MODAL */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-red-800 flex items-center gap-2"> LÝ DO TỪ CHỐI</h3>
              <button onClick={() => setRejectModal({ show: false, menuId: null, reason: '' })} className="text-red-400 hover:text-red-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Thông báo lại cho Bếp:</label>
              <textarea
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-red-500 min-h-[120px] text-sm resize-none font-medium text-gray-800"
                placeholder="Ví dụ: Định lượng calo suất mặn chưa đủ..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setRejectModal({ show: false, menuId: null, reason: '' })}
                  className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >Hủy bỏ</button>
                <button
                  onClick={handleRejectSubmit}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 transition-colors shadow-sm"
                >Xác nhận Từ chối</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-[110] px-6 py-3 rounded shadow-sm font-bold text-sm flex items-center gap-2 animate-in slide-in-from-bottom-5 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
          }`}>
          <span className="text-xl mr-2">{toast.type === 'error' ? '❌' : '✅'}</span>
          {toast.message}
        </div>
      )}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}

// SỬA COMPONENT NAVITEM ĐỂ ẨN HIỆN CHỮ THEO SIDEBAR
function NavItem({ icon: Icon, label, active, onClick, expanded }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-2.5 rounded font-semibold text-sm transition-all relative group ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <Icon size={18} className="shrink-0" />
      <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
        {label}
      </span>

      {/* Tooltip khi sidebar thu nhỏ */}
      {!expanded && (
        <div className="absolute left-16 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-md">
          {label}
        </div>
      )}
    </button>
  );
}

function StatCard({ label, value, color, icon: Icon, alert }) {
  const themes = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    pink: 'text-pink-600 bg-pink-50 border-pink-100'
  };
  return (
    <div className={`bg-white p-5 rounded-md shadow-sm border transition-all ${alert ? 'border-red-300 shadow-md scale-105' : 'border-gray-100 hover:shadow-md'}`}>
      <div className={`w-10 h-10 rounded flex items-center justify-center mb-4 border shadow-inner ${themes[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-semibold text-gray-500 tracking-wide">{label}</p>
      <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  );
}