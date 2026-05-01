import React, { useState, useEffect } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, Users, GraduationCap, Utensils, CreditCard,
  LogOut, Globe, Search, CheckCircle, AlertTriangle, X, DollarSign, Clock, Check, Download, BellRing
 , User } from 'lucide-react';
import api from '../../services/api';

export default function PaymentManagement() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user')) || { role: 'Guest', fullName: 'Admin' };
  const userRole = currentUser.role;

  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [filterClass, setFilterClass] = useState('Tất cả');
  const [filterMethod, setFilterMethod] = useState('Tất cả');
  const [filterMonth, setFilterMonth] = useState('Tất cả');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const uniqueClasses = Array.from(new Set(payments.map(p => p.classRoom))).filter(Boolean).sort();
  const uniqueMonths = Array.from(new Set(payments.map(p => p.month))).filter(Boolean).sort((a, b) => b.localeCompare(a));

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(res.data?.data || []);
    } catch (error) {
      showToast("Lỗi tải dữ liệu thanh toán", "error");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleConfirmPayment = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending Payment' ? 'Paid' : 'Pending Payment';
    if (!window.confirm(newStatus === 'Paid' ? "Xác nhận đã thu tiền cho hóa đơn này?" : "Hủy xác nhận thu tiền?")) return;

    try {
      await api.put(`/payments/${id}`, { status: newStatus });
      showToast(newStatus === 'Paid' ? "Đã xác nhận thu tiền!" : "Đã hủy xác nhận!");
      fetchPayments();
    } catch (error) {
      showToast("Lỗi cập nhật", "error");
    }
  };

  // ADMIN: Hàm chốt số lượng báo bếp
  const handleInformKitchen = async () => {
    if (!window.confirm("Chốt danh sách đăng ký hiện tại và gửi thông báo chuẩn bị suất ăn cho bộ phận Bếp?")) return;
    try {
      const res = await api.post('/payments/inform-kitchen');
      showToast(res.data.message, "success");
    } catch (error) {
      showToast("Lỗi khi gửi thông báo", "error");
    }
  };

  // HÀM XUẤT FILE CSV
  const exportToCSV = () => {
    if (filteredPayments.length === 0) {
      showToast("Không có dữ liệu để xuất!", "error");
      return;
    }

    // Tạo BOM để Excel đọc được tiếng Việt có dấu
    const BOM = "\uFEFF";
    const headers = ['Học sinh', 'Lớp', 'Phụ huynh', 'SĐT', 'Tháng', 'Tổng tiền (VND)', 'Phương thức', 'Trạng thái'];

    const csvRows = [headers.join(',')];
    filteredPayments.forEach(p => {
      const statusTxt = p.status === 'Paid' ? 'Đã thanh toán' : p.status === 'Cancelled' ? 'Đã hủy' : 'Chờ thanh toán';
      const methodTxt = p.paymentMethod === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản';
      // Bọc chuỗi trong nháy kép để tránh lỗi dấu phẩy trong tên
      csvRows.push(`"${p.studentName}","${p.classRoom}","${p.parentName}","${p.parentPhone}","${p.month}","${p.totalAmount}","${methodTxt}","${statusTxt}"`);
    });

    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `DanhSachThanhToan_${userRole}_${new Date().toLocaleDateString('vi-VN')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const filteredPayments = payments.filter(p => {
    const matchSearch = p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.classRoom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'Tất cả' ||
      (filterStatus === 'Paid' && p.status === 'Paid') ||
      (filterStatus === 'Pending' && p.status !== 'Paid' && p.status !== 'Cancelled');
    const matchClass = filterClass === 'Tất cả' || p.classRoom === filterClass;
    const matchMethod = filterMethod === 'Tất cả' || p.paymentMethod === filterMethod;
    const matchMonth = filterMonth === 'Tất cả' || p.month === filterMonth;
    return matchSearch && matchStatus && matchClass && matchMethod && matchMonth;
  });

  const statsBasePayments = payments.filter(p => {
    const matchMonth = filterMonth === 'Tất cả' || p.month === filterMonth;
    const matchClass = filterClass === 'Tất cả' || p.classRoom === filterClass;
    return matchMonth && matchClass;
  });

  const totalCollected = statsBasePayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPending = statsBasePayments.filter(p => p.status !== 'Paid' && p.status !== 'Cancelled').reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  const getPaymentDeadlineInfo = (monthStr) => {
    if (!monthStr || monthStr === 'Tất cả') return null;
    const [year, month] = monthStr.split('-').map(Number);
    let deadlineYear = year;
    let deadlineMonth = month - 1;
    if (deadlineMonth === 0) {
      deadlineMonth = 12;
      deadlineYear -= 1;
    }
    const deadline = new Date(deadlineYear, deadlineMonth - 1, 25);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { deadline, diffDays };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex  text-slate-700">

      {/* SIDEBAR */}
      <aside onMouseEnter={() => setIsSidebarExpanded(true)} onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 z-50 ${isSidebarExpanded ? 'w-64 shadow-sm' : 'w-20'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shrink-0"><Shield size={20} /></div>
          <span className={`font-bold text-lg tracking-tight text-slate-900 transition-opacity ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>TMS ADMIN</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-hidden">
          {userRole === 'Admin' && <NavItem icon={LayoutDashboard} label="Dashboard" expanded={isSidebarExpanded} onClick={() => navigate('/admin/dashboard')} />}
          {userRole === 'Admin' && <NavItem icon={Users} label="Người dùng" expanded={isSidebarExpanded} onClick={() => navigate('/admin/users')} />}
          <NavItem icon={GraduationCap} label="Học sinh" expanded={isSidebarExpanded} onClick={() => navigate('/admin/students')} />
          {userRole === 'Admin' && <NavItem icon={Utensils} label="Thực đơn" expanded={isSidebarExpanded} onClick={() => navigate('/admin/menus')} />}
          {(userRole === 'Admin' || userRole === 'Teacher') && <NavItem icon={CreditCard} label="Thanh toán" active expanded={isSidebarExpanded} onClick={() => navigate('/admin/payments')} />}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <h2 className="font-semibold text-slate-400 text-xs uppercase tracking-wider">{currentUser.fullName} - {userRole === 'Teacher' ? 'Giáo viên' : 'Admin'}</h2>
          
            <div className="relative group cursor-pointer pb-2 -mb-2 z-[100] ml-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-sm transition-transform group-hover:scale-105">
                  <User size={16} />
                </span>
              </div>
              
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-md">
                  <p className="text-[13px] font-bold text-slate-800">Tài khoản</p>
                </div>
                <div className="p-1.5">
                  <button onClick={() => setIsProfileModalOpen(true)} className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors font-semibold">Thay đổi mật khẩu</button>
                  <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded transition-colors font-bold mt-1">Đăng xuất</button>
                </div>
              </div>
            </div>

        </header>

        <main className="p-8 space-y-6">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{userRole === 'Teacher' ? 'Thu tiền lớp chủ nhiệm' : 'Quản lý thanh toán'}</h1>
              <p className="text-slate-500 text-sm mt-1">{userRole === 'Teacher' ? 'Xác nhận tiền mặt và xuất danh sách lớp.' : 'Theo dõi thu tiền và chốt số lượng báo bếp.'}</p>
            </div>

            {/* BỘ LỌC KỲ THU TIỀN ĐƯỢC LÀM NỔI BẬT */}
            <div className="flex items-center gap-3 bg-indigo-50 p-1.5 rounded border border-indigo-100 shadow-sm">
              <span className="text-sm font-semibold text-indigo-800 px-3">Kỳ thu tiền:</span>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-4 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 cursor-pointer min-w-[160px]">
                <option value="Tất cả">Tất cả các tháng</option>
                {uniqueMonths.map(m => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center z-10 relative">
            <div className="relative w-full md:w-auto flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" placeholder="Tìm học sinh, lớp..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full shadow-sm transition-all" />
            </div>

            <div className="flex flex-wrap items-center gap-3">

              {userRole === 'Admin' && (
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-semibold text-slate-600 cursor-pointer">
                  <option value="Tất cả">Lớp: Tất cả</option>
                  {uniqueClasses.map(c => <option key={c} value={c}>Lớp {c}</option>)}
                </select>
              )}

              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-semibold text-slate-600 cursor-pointer">
                <option value="Tất cả">Trạng thái</option>
                <option value="Pending">Chờ thanh toán</option>
                <option value="Paid">Đã thanh toán</option>
              </select>

              <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-semibold text-slate-600 cursor-pointer">
                <option value="Tất cả">Hình thức</option>
                <option value="Cash">Tiền mặt</option>
                <option value="Transfer">Chuyển khoản</option>
              </select>

              {/* NÚT XUẤT EXCEL CHO CẢ ADMIN VÀ GIÁO VIÊN */}
              <button onClick={exportToCSV} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded text-sm font-bold hover:bg-emerald-100 flex items-center gap-2 transition-all">
                Xuất CSV
              </button>

              {/* NÚT BÁO BẾP CHỈ DÀNH CHO ADMIN */}
              {userRole === 'Admin' && (
                <button onClick={handleInformKitchen} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold shadow-md hover:bg-indigo-700 flex items-center gap-2 transition-all relative">
                  Chốt báo Bếp
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">26</span>
                </button>
              )}
            </div>
          </div>

          {userRole === 'Teacher' && new Date().getDate() >= 25 && (
            <div className="bg-red-50 text-red-700 p-4 rounded border border-red-200 flex items-center gap-3">

              <div>
                <p className="font-bold text-sm">Hết hạn thu tiền mặt</p>
                <p className="text-xs mt-0.5">Hệ thống chỉ cho phép Giáo viên thu tiền mặt trước ngày 25 hàng tháng. Bạn không thể xác nhận hóa đơn lúc này.</p>
              </div>
            </div>
          )}

          {/* WIDGET THỐNG KÊ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">

              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Đã thu {userRole === 'Teacher' && 'của lớp'}</p>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(totalCollected)}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">

              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Chờ thu {userRole === 'Teacher' && 'của lớp'}</p>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(totalPending)}</h3>
              </div>
            </div>
          </div>

          {/* BẢNG DỮ LIỆU */}
          <section className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-4">Học sinh / Lớp</th>
                    <th className="p-4">Phụ huynh</th>
                    <th className="p-4">Đơn hàng</th>
                    <th className="p-4 text-center">Hình thức</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-right">Xác nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-400 italic">Đang tải dữ liệu...</td></tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-medium">Không có dữ liệu.</td></tr>
                  ) : filteredPayments.map((payment) => {

                    const isExpired = userRole === 'Teacher' && new Date().getDate() >= 25;
                    // Logic: Chỉ cho phép duyệt thủ công với Tiền mặt. Admin duyệt được hết, Giáo viên duyệt nếu chưa quá hạn.
                    const canConfirm = payment.paymentMethod === 'Cash' && (userRole === 'Admin' || (userRole === 'Teacher' && !isExpired));

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-slate-900">{payment.studentName}</p>
                          <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50 inline-block px-1.5 py-0.5 rounded mt-1">Lớp {payment.classRoom}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-slate-900">{payment.parentName}</p>
                          <p className="text-[10px] text-slate-400">{payment.parentPhone}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-black text-slate-900">{formatCurrency(payment.totalAmount)}</p>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5">Tháng {payment.month} ({payment.totalDays} bữa)</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${payment.paymentMethod === 'Cash' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                            {payment.paymentMethod === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {payment.status === 'Paid' ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-green-50 text-green-600 border border-green-100">Đã thanh toán</span>
                              {payment.updatedAt && <span className="text-[9px] text-green-600 font-medium">Lúc: {formatDate(payment.updatedAt)}</span>}
                            </div>
                          ) : payment.status === 'Cancelled' ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-100">Đã hủy</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-100">Chờ thanh toán</span>
                              {(() => {
                                const deadlineInfo = getPaymentDeadlineInfo(payment.month);
                                if (!deadlineInfo) return null;
                                if (deadlineInfo.diffDays < 0) {
                                  return <span className="text-[9px] text-red-500 font-bold">Quá hạn {-deadlineInfo.diffDays} ngày</span>;
                                } else if (deadlineInfo.diffDays === 0) {
                                  return <span className="text-[9px] text-orange-500 font-bold">Hết hạn hôm nay</span>;
                                } else {
                                  return <span className="text-[9px] text-amber-600 font-medium">Còn {deadlineInfo.diffDays} ngày</span>;
                                }
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {canConfirm ? (
                            payment.status === 'Paid' ? (
                              <button onClick={() => handleConfirmPayment(payment.id, payment.status)} className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors underline">Hủy xác nhận</button>
                            ) : payment.status !== 'Cancelled' ? (
                              <button onClick={() => handleConfirmPayment(payment.id, payment.status)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 flex items-center gap-1.5 ml-auto shadow-sm transition-all">
                                 Xác nhận
                              </button>
                            ) : null
                          ) : (
                            // Nếu là Giáo viên mà phụ huynh chọn Chuyển khoản hoặc hết hạn
                            <span className="text-[10px] text-slate-400 italic">
                              {userRole === 'Teacher' && isExpired ? 'Đã hết hạn' : 'Chờ kế toán'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {toast.show && (
        <div className={`fixed top-5 right-5 z-[9999] px-6 py-3.5 rounded-md shadow-sm flex items-center gap-2 border ${toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          <span className="text-xl">{toast.type === 'error' ? '❌' : '✅'}</span>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, expanded }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded font-semibold text-[13px] relative group transition-all ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
      <Icon size={18} className="shrink-0" />
      <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{label}</span>
      {!expanded && <div className="absolute left-16 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-[100]">{label}</div>}
    </button>
  );
}