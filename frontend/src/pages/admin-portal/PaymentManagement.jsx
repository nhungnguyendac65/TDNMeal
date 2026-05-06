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
  const currentUser = JSON.parse(localStorage.getItem('user')) || { Role: 'Guest', role: 'Guest', fullName: 'Admin' };
  const userRole = currentUser.Role || currentUser.role;

  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterMethod, setFilterMethod] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
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
      showToast("Error loading payment data", "error");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleConfirmPayment = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending Payment' ? 'Paid' : 'Pending Payment';
    if (!window.confirm(newStatus === 'Paid' ? "Confirm payment received for this invoice?" : "Cancel payment confirmation?")) return;

    try {
      await api.put(`/payments/${id}`, { status: newStatus });
      showToast(newStatus === 'Paid' ? "Payment confirmed!" : "Confirmation cancelled!");
      fetchPayments();
    } catch (error) {
      showToast("Update error", "error");
    }
  };

  // ADMIN: Function to finalize counts for kitchen
  const handleInformKitchen = async () => {
    if (!window.confirm("Finalize current registrations and notify the Kitchen department?")) return;
    try {
      const res = await api.post('/payments/inform-kitchen');
      showToast(res.data.message, "success");
    } catch (error) {
      showToast("Error sending notification", "error");
    }
  };

  // EXPORT TO CSV FUNCTION
  const exportToCSV = () => {
    if (filteredPayments.length === 0) {
      showToast("No data to export!", "error");
      return;
    }

    // Create BOM for Excel to read UTF-8
    const BOM = "\uFEFF";
    const headers = ['Student', 'Class', 'Parent', 'Phone', 'Month', 'Total Amount (VND)', 'Method', 'Status'];

    const csvRows = [headers.join(',')];
    filteredPayments.forEach(p => {
      const statusTxt = p.status === 'Paid' ? 'Paid' : p.status === 'Cancelled' ? 'Cancelled' : 'Pending Payment';
      const methodTxt = p.paymentMethod === 'Cash' ? 'Cash' : 'Transfer';
      // Wrap strings in quotes to avoid comma issues
      csvRows.push(`"${p.studentName}","${p.classRoom}","${p.parentName}","${p.parentPhone}","${p.month}","${p.totalAmount}","${methodTxt}","${statusTxt}"`);
    });

    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `PaymentList_${userRole}_${new Date().toLocaleDateString('en-US')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const filteredPayments = payments.filter(p => {
    const matchSearch = p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.classRoom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' ||
      (filterStatus === 'Paid' && p.status === 'Paid') ||
      (filterStatus === 'Pending' && p.status !== 'Paid' && p.status !== 'Cancelled');
    const matchClass = filterClass === 'All' || p.classRoom === filterClass;
    const matchMethod = filterMethod === 'All' || p.paymentMethod === filterMethod;
    const matchMonth = filterMonth === 'All' || p.month === filterMonth;
    return matchSearch && matchStatus && matchClass && matchMethod && matchMonth;
  });

  const statsBasePayments = payments.filter(p => {
    const matchMonth = filterMonth === 'All' || p.month === filterMonth;
    const matchClass = filterClass === 'All' || p.classRoom === filterClass;
    return matchMonth && matchClass;
  });

  const totalCollected = statsBasePayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPending = statsBasePayments.filter(p => p.status !== 'Paid' && p.status !== 'Cancelled').reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  const getPaymentDeadlineInfo = (monthStr) => {
    if (!monthStr || monthStr === 'All') return null;
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
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex  text-slate-700">

      {/* SIDEBAR */}
      <aside onMouseEnter={() => setIsSidebarExpanded(true)} onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 z-50 ${isSidebarExpanded ? 'w-64 shadow-sm' : 'w-20'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className={`font-bold text-lg tracking-tight text-slate-900 transition-opacity ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>TMS ADMIN</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-hidden">
          {userRole === 'Admin' && <NavItem icon={LayoutDashboard} label="Dashboard" expanded={isSidebarExpanded} onClick={() => navigate('/admin/dashboard')} />}
          {userRole === 'Admin' && <NavItem icon={Users} label="Users" expanded={isSidebarExpanded} onClick={() => navigate('/admin/users')} />}
          <NavItem icon={GraduationCap} label="Students" expanded={isSidebarExpanded} onClick={() => navigate('/admin/students')} />
          {userRole === 'Admin' && <NavItem icon={Utensils} label="Menus" expanded={isSidebarExpanded} onClick={() => navigate('/admin/menus')} />}
          {(userRole === 'Admin' || userRole === 'Teacher') && <NavItem icon={CreditCard} label="Payments" active expanded={isSidebarExpanded} onClick={() => navigate('/admin/payments')} />}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <h2 className="font-semibold text-slate-400 text-xs uppercase tracking-wider">{currentUser.fullName}</h2>
          
            <div className="relative group cursor-pointer pb-2 -mb-2 z-[100] ml-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-sm transition-transform group-hover:scale-105">
                  <User size={16} />
                </span>
              </div>
              
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-md">
                  <p className="text-[13px] font-bold text-slate-800">Account</p>
                </div>
                <div className="p-1.5">
                  <button onClick={() => setIsProfileModalOpen(true)} className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors font-semibold">Change password</button>
                  <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded transition-colors font-bold mt-1">Logout</button>
                </div>
              </div>
            </div>

        </header>

        <main className="p-8 space-y-6">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{userRole === 'Teacher' ? 'Class Payment Collection' : 'Payment Management'}</h1>
              <p className="text-slate-500 text-sm mt-1">{userRole === 'Teacher' ? 'Confirm cash payments and export class list.' : 'Track payments and finalize counts for kitchen.'}</p>
            </div>

            {/* HIGHLIGHTED PAYMENT PERIOD FILTER */}
            <div className="flex items-center gap-3 bg-indigo-50 p-1.5 rounded border border-indigo-100 shadow-sm">
              <span className="text-sm font-semibold text-indigo-800 px-3">Payment Period:</span>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-4 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 cursor-pointer min-w-[160px]">
                <option value="All">All months</option>
                {uniqueMonths.map(m => <option key={m} value={m}>Month {m}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center z-10 relative">
            <div className="relative w-full md:w-auto flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" placeholder="Search student, class..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full shadow-sm transition-all" />
            </div>

            <div className="flex flex-wrap items-center gap-3">

              {userRole === 'Admin' && (
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-semibold text-slate-600 cursor-pointer">
                  <option value="All">Class: All</option>
                  {uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              )}

              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-semibold text-slate-600 cursor-pointer">
                <option value="All">Status</option>
                <option value="Pending">Pending Payment</option>
                <option value="Paid">Paid</option>
              </select>

              <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-semibold text-slate-600 cursor-pointer">
                <option value="All">Method</option>
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
              </select>

              {/* EXPORT EXCEL BUTTON FOR BOTH ADMIN AND TEACHER */}
              <button onClick={exportToCSV} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded text-sm font-bold hover:bg-emerald-100 flex items-center gap-2 transition-all">
                Export CSV
              </button>

              {/* KITCHEN NOTIFICATION BUTTON ONLY FOR ADMIN */}
              {userRole === 'Admin' && (
                <button onClick={handleInformKitchen} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold shadow-md hover:bg-indigo-700 flex items-center gap-2 transition-all relative">
                  Finalize for Kitchen
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">26</span>
                </button>
              )}
            </div>
          </div>

          {userRole === 'Teacher' && new Date().getDate() >= 25 && (
            <div className="bg-red-50 text-red-700 p-4 rounded border border-red-200 flex items-center gap-3">
              <div>
                <p className="font-bold text-sm">Cash collection deadline passed</p>
                <p className="text-xs mt-0.5">The system only allows Teachers to collect cash before the 25th of each month. You cannot confirm invoices at this time.</p>
              </div>
            </div>
          )}

          {/* STATISTICS WIDGET */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">

              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Collected {userRole === 'Teacher' && 'for class'}</p>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(totalCollected)}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">

              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Pending {userRole === 'Teacher' && 'for class'}</p>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(totalPending)}</h3>
              </div>
            </div>
          </div>

          {/* DATA TABLE */}
          <section className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-4">Student / Class</th>
                    <th className="p-4">Parent</th>
                    <th className="p-4">Order</th>
                    <th className="p-4 text-center">Method</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Confirmation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {isLoading ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-400 italic">Loading data...</td></tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-medium">No data found.</td></tr>
                  ) : filteredPayments.map((payment) => {

                    const isExpired = userRole === 'Teacher' && new Date().getDate() >= 25;
                    // Logic: Manual approval allowed for Cash only. Admin can approve all, Teacher if within deadline.
                    const canConfirm = payment.paymentMethod === 'Cash' && (userRole === 'Admin' || (userRole === 'Teacher' && !isExpired));

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-slate-900">{payment.studentName}</p>
                          <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50 inline-block px-1.5 py-0.5 rounded mt-1">Class {payment.classRoom}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-slate-900">{payment.parentName}</p>
                          <p className="text-[10px] text-slate-400">{payment.parentPhone}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-black text-slate-900">{formatCurrency(payment.totalAmount)}</p>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5">Month {payment.month} ({payment.totalDays} meals)</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${payment.paymentMethod === 'Cash' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                            {payment.paymentMethod === 'Cash' ? 'Cash' : 'Transfer'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {payment.status === 'Paid' ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-green-50 text-green-600 border border-green-100">Paid</span>
                              {payment.updatedAt && <span className="text-[9px] text-green-600 font-medium">At: {formatDate(payment.updatedAt)}</span>}
                            </div>
                          ) : payment.status === 'Cancelled' ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-100">Cancelled</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-100">Pending Payment</span>
                              {(() => {
                                const deadlineInfo = getPaymentDeadlineInfo(payment.month);
                                if (!deadlineInfo) return null;
                                if (deadlineInfo.diffDays < 0) {
                                  return <span className="text-[9px] text-red-500 font-bold">Overdue {-deadlineInfo.diffDays} days</span>;
                                } else if (deadlineInfo.diffDays === 0) {
                                  return <span className="text-[9px] text-orange-500 font-bold">Expires today</span>;
                                } else {
                                  return <span className="text-[9px] text-amber-600 font-medium">{deadlineInfo.diffDays} days left</span>;
                                }
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {canConfirm ? (
                            payment.status === 'Paid' ? (
                              <button onClick={() => handleConfirmPayment(payment.id, payment.status)} className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors underline">Cancel confirmation</button>
                            ) : payment.status !== 'Cancelled' ? (
                              <button onClick={() => handleConfirmPayment(payment.id, payment.status)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 flex items-center gap-1.5 ml-auto shadow-sm transition-all">
                                 Confirm
                              </button>
                            ) : null
                          ) : (
                            <span className={`text-[10px] italic font-bold ${payment.status === 'Paid' ? 'text-green-600' : 'text-slate-400'}`}>
                              {payment.status === 'Paid' ? 'Paid' : (userRole === 'Teacher' && isExpired ? 'Expired' : 'Waiting for Accountant')}
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
      <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{label}</span>
      {!expanded && <div className="absolute left-16 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-[100]">{label}</div>}
    </button>
  );
}