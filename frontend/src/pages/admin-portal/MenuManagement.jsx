import React, { useState, useEffect } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, Users, GraduationCap, Utensils, CreditCard,
  LogOut, Search, CheckCircle, AlertTriangle, X, Check, XCircle, Calendar as CalendarIcon, ChevronRight, Image as ImageIcon
 , User } from 'lucide-react';
import api, { getFullUrl } from '../../services/api';

const getWeekOfMonth = (dateString) => {
  const date = new Date(dateString);
  const startMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = startMonth.getDay() === 0 ? 7 : startMonth.getDay();
  return Math.ceil((date.getDate() + dayOfWeek - 1) / 7);
};

const getDayName = (dateString) => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export default function MenuManagement() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user')) || { role: 'Guest', fullName: 'Admin' };
  const userRole = currentUser.role;

  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterWeek, setFilterWeek] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [detailModal, setDetailModal] = useState({ show: false, menu: null });
  const [rejectModal, setRejectModal] = useState({ show: false, menuId: null, reason: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/menus');
      const data = res.data?.data || [];
      setMenus(data);

      // Initialize default month if not yet set
      if (data.length > 0 && !filterMonth) {
        const uniqueMonths = Array.from(new Set(data.map(m => m.date.substring(0, 7)))).sort().reverse();
        setFilterMonth(uniqueMonths[0]);
      }
    } catch (error) {
      showToast("Error loading menu data", "error");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchMenus(); }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this menu?")) return;
    try {
      await api.put(`/menus/${id}`, { status: 'Approved' });
      showToast("Menu approved!");
      setDetailModal({ show: false, menu: null });
      fetchMenus();
    } catch (error) {
      showToast("Error updating status", "error");
    }
  };

  const handleApproveWeek = async () => {
    const menusToApprove = menusInWeek.filter(m => m.status === 'Submitted');
    if (menusToApprove.length === 0) {
      alert("No menus are pending approval this week.");
      return;
    }
    if (!window.confirm(`Are you sure you want to approve all ${menusToApprove.length} pending menus in Week ${filterWeek}?`)) return;

    try {
      await Promise.all(menusToApprove.map(m => api.put(`/menus/${m.id}`, { status: 'Approved' })));
      showToast("Approved all menus for the week!");
      fetchMenus();
    } catch (error) {
      showToast("Error batch updating status", "error");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) {
      alert("Please enter a reason for rejection!");
      return;
    }
    try {
      await api.put(`/menus/${rejectModal.menuId}`, {
        status: 'Rejected',
        rejectReason: rejectModal.reason
      });
      showToast("Menu rejected!");
      setRejectModal({ show: false, menuId: null, reason: '' });
      setDetailModal({ show: false, menu: null });
      fetchMenus();
    } catch (error) {
      showToast("Error updating status", "error");
    }
  };

  const uniqueMonths = Array.from(new Set(menus.map(m => m.date?.substring(0, 7)))).filter(Boolean).sort().reverse();

  // Filter data by month
  const menusInMonth = menus.filter(m => m.date?.startsWith(filterMonth));

  // Filter data by week
  const menusInWeek = menusInMonth.filter(m => getWeekOfMonth(m.date) === filterWeek).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Auto-adjust filterWeek if selecting a new month where that week has no data
  useEffect(() => {
    if (menusInMonth.length > 0) {
      const weeksAvailable = Array.from(new Set(menusInMonth.map(m => getWeekOfMonth(m.date)))).sort();
      if (!weeksAvailable.includes(filterWeek)) {
        setFilterWeek(weeksAvailable[0]);
      }
    }
  }, [filterMonth, menusInMonth, filterWeek]);

  const weeksInMonth = Array.from(new Set(menusInMonth.map(m => getWeekOfMonth(m.date)))).sort();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex  text-slate-700">

      {/* SIDEBAR */}
      <aside onMouseEnter={() => setIsSidebarExpanded(true)} onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 z-50 ${isSidebarExpanded ? 'w-64 shadow-sm' : 'w-20'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className={`font-bold text-lg tracking-tight text-slate-900 transition-opacity ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>TMS ADMIN</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-hidden">
          <NavItem icon={LayoutDashboard} label="Dashboard" expanded={isSidebarExpanded} onClick={() => navigate('/admin/dashboard')} />
          {userRole === 'Admin' && <NavItem icon={Users} label="Users" expanded={isSidebarExpanded} onClick={() => navigate('/admin/users')} />}
          <NavItem icon={GraduationCap} label="Students" expanded={isSidebarExpanded} onClick={() => navigate('/admin/students')} />
          <NavItem icon={Utensils} label="Menus" active expanded={isSidebarExpanded} onClick={() => navigate('/admin/menus')} />
          {(userRole === 'Admin' || userRole === 'Teacher') && <NavItem icon={CreditCard} label="Payments" expanded={isSidebarExpanded} onClick={() => navigate('/admin/payments')} />}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <h2 className="font-semibold text-slate-400 text-xs uppercase tracking-wider">{currentUser.fullName} - {userRole === 'Teacher' ? 'Teacher' : 'Admin'}</h2>
          
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
              <h1 className="text-2xl font-bold text-slate-900">Menu Approval</h1>
              <p className="text-slate-500 text-sm mt-1">Manage and review menus by Week/Month structure.</p>
            </div>

            {/* FILTER BY MONTH */}
            <div className="flex items-center gap-3 bg-white p-1.5 rounded border border-slate-200 shadow-sm">
              <span className="text-sm font-semibold text-slate-500 px-3 flex items-center gap-2"><CalendarIcon size={16} /> Select Month:</span>
              <div className="relative">
                <input
                  type="month"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  onClick={e => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                  className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px] text-transparent relative z-10"
                  style={{ color: 'transparent' }}
                />
                <div className="absolute inset-0 pointer-events-none flex items-center px-4 text-sm font-bold text-indigo-700 z-20">
                  {filterMonth ? `Month ${filterMonth.split('-')[1]}/${filterMonth.split('-')[0]}` : 'Select month'}
                </div>
              </div>
            </div>
          </div>

          {/* FILTER BY WEEK */}
          {weeksInMonth.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="bg-white border border-slate-200 rounded-md p-2 flex gap-2 shadow-sm overflow-x-auto w-full md:w-auto">
                {weeksInMonth.map(week => {
                  const menusInThisWeek = menusInMonth.filter(m => getWeekOfMonth(m.date) === week).sort((a, b) => new Date(a.date) - new Date(b.date));
                  const startDate = new Date(menusInThisWeek[0].date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
                  const endDate = new Date(menusInThisWeek[menusInThisWeek.length - 1].date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });

                  return (
                    <button
                      key={week}
                      onClick={() => setFilterWeek(week)}
                      className={`px-6 py-2.5 rounded text-sm font-bold transition-all whitespace-nowrap ${filterWeek === week
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                      Week {week} ({startDate} - {endDate})
                    </button>
                  );
                })}
              </div>
              {menusInWeek.some(m => m.status === 'Submitted') && userRole === 'Admin' && (
                <button
                  onClick={handleApproveWeek}
                  className="px-6 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap w-full md:w-auto"
                >
                  Approve All Week {filterWeek}
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-12 text-center text-slate-500">
              Loading menu data...
            </div>
          ) : menusInWeek.length === 0 ? (
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-12 text-center text-slate-500">
              No menus found for this week.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {menusInWeek.map(menu => (
                <div
                  key={menu.id}
                  onClick={() => setDetailModal({ show: true, menu })}
                  className="bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer overflow-hidden flex flex-col group relative"
                >
                  <div className="p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{getDayName(menu.date)}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">{new Date(menu.date).toLocaleDateString('en-US')}</p>
                      </div>
                      <div className="shrink-0">
                        {menu.status === 'Approved' && <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">Approved</span>}
                        {menu.status === 'Rejected' && <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200 flex items-center gap-1"><XCircle size={12} /> Rejected</span>}
                        {menu.status === 'Submitted' && <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1"> Pending</span>}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Energy</span>
                        <span className="text-base font-bold text-orange-600">{menu.totalCalories} kcal</span>
                      </div>
                      <div className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sm font-bold">
                        Details <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* MENU DETAIL MODAL */}
      {detailModal.show && detailModal.menu && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-md shadow-sm w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[90vh]">

            {/* HEADER */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  Menu Details: {getDayName(detailModal.menu.date)} ({new Date(detailModal.menu.date).toLocaleDateString('en-US')})
                </h2>
                <div className="flex items-center gap-3 mt-1.5">
                  {detailModal.menu.status === 'Approved' && <span className="text-sm font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-md">Status: Approved</span>}
                  {detailModal.menu.status === 'Rejected' && <span className="text-sm font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-md">Status: Rejected</span>}
                  {detailModal.menu.status === 'Submitted' && <span className="text-sm font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">Status: Pending</span>}
                </div>
              </div>
              <button onClick={() => setDetailModal({ show: false, menu: null })} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">

              {detailModal.menu.status === 'Rejected' && detailModal.menu.rejectReason && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded p-4 flex gap-3">
                  
                  <div>
                    <h4 className="font-bold text-red-800 text-sm">Rejection Reason:</h4>
                    <p className="text-red-700 text-sm mt-1">{detailModal.menu.rejectReason}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* STANDARD COLUMN */}
                <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                  <div className="bg-orange-50 px-5 py-3 border-b border-orange-100 flex justify-between items-center">
                    <h3 className="font-black text-orange-800 uppercase tracking-wide">Standard Meal (Meat)</h3>
                    <span className="font-bold text-orange-600 text-sm">{detailModal.menu.standardDishes?.reduce((sum, d) => sum + (Number(d.Calories) || 0), 0) || 0} kcal</span>
                  </div>
                  <div className="p-5 space-y-4">
                    {detailModal.menu.standardDishes?.length > 0 ? detailModal.menu.standardDishes.map((dish, idx) => (
                      <div key={idx} className="flex gap-4 items-center p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="w-16 h-16 rounded-lg bg-slate-200 shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
                          {dish.ImageUrl ? (
                            <img src={getFullUrl(dish.ImageUrl)} alt={dish.DishName} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-slate-400" size={24} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 truncate text-base">{dish.DishName}</h4>
                          <p className="text-xs text-slate-500 mt-1 truncate">Type: <span className="font-semibold text-slate-700">{dish.Type}</span></p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{dish.Calories} kcal</span>
                            <span className="text-[11px] font-medium text-slate-500 truncate">{dish.SupplierName}</span>
                          </div>
                        </div>
                      </div>
                    )) : <p className="text-slate-400 italic text-sm text-center py-4">No dishes added</p>}
                  </div>
                </div>

                {/* VEGETARIAN COLUMN */}
                <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                  <div className="bg-green-50 px-5 py-3 border-b border-green-100 flex justify-between items-center">
                    <h3 className="font-black text-green-800 uppercase tracking-wide">Vegetarian Meal</h3>
                    <span className="font-bold text-green-600 text-sm">{detailModal.menu.vegetarianDishes?.reduce((sum, d) => sum + (Number(d.Calories) || 0), 0) || 0} kcal</span>
                  </div>
                  <div className="p-5 space-y-4">
                    {detailModal.menu.vegetarianDishes?.length > 0 ? detailModal.menu.vegetarianDishes.map((dish, idx) => (
                      <div key={idx} className="flex gap-4 items-center p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="w-16 h-16 rounded-lg bg-slate-200 shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
                          {dish.ImageUrl ? (
                            <img src={getFullUrl(dish.ImageUrl)} alt={dish.DishName} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-slate-400" size={24} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 truncate text-base">{dish.DishName}</h4>
                          <p className="text-xs text-slate-500 mt-1 truncate">Type: <span className="font-semibold text-slate-700">{dish.Type}</span></p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{dish.Calories} kcal</span>
                            <span className="text-[11px] font-medium text-slate-500 truncate">{dish.SupplierName}</span>
                          </div>
                        </div>
                      </div>
                    )) : <p className="text-slate-400 italic text-sm text-center py-4">No dishes added</p>}
                  </div>
                </div>

              </div>
            </div>

            {/* FOOTER ACTIONS */}
            {detailModal.menu.status === 'Submitted' && userRole === 'Admin' && (
              <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0">
                <button
                  onClick={() => setRejectModal({ show: true, menuId: detailModal.menu.id, reason: '' })}
                  className="px-6 py-2.5 font-bold text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors shadow-sm"
                >
                  Reject Menu
                </button>
                <button
                  onClick={() => handleApprove(detailModal.menu.id)}
                  className="px-6 py-2.5 font-bold text-white bg-green-600 rounded hover:bg-green-700 transition-colors shadow-sm"
                >
                  Approve
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* NESTED REJECT MODAL */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-red-800 flex items-center gap-2"> REJECTION REASON</h3>
              <button onClick={() => setRejectModal({ show: false, menuId: null, reason: '' })} className="text-red-400 hover:text-red-600"><X size={20} /></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Notify Kitchen:</label>
              <textarea
                className="w-full p-4 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-red-500 min-h-[120px] text-sm resize-none bg-slate-50 focus:bg-white"
                placeholder="Ex: Calories for standard meal are insufficient, soup dish is duplicated..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setRejectModal({ show: false, menuId: null, reason: '' })}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                >Cancel</button>
                <button
                  onClick={handleRejectSubmit}
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 transition-colors shadow-sm"
                >Confirm Rejection</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-[70] px-6 py-3 rounded shadow-sm font-bold text-sm flex items-center gap-2 animate-in slide-in-from-bottom-5 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}>
          <span className="text-xl mr-2">{toast.type === 'error' ? '❌' : '✅'}</span>
          {toast.message}
        </div>
      )}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}

function NavItem({ icon: Icon, label, active, expanded, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded font-semibold text-sm transition-all duration-200 ${active
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <span className={`whitespace-nowrap transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden lg:block lg:opacity-0'}`}>
        {label}
      </span>
    </button>
  );
}