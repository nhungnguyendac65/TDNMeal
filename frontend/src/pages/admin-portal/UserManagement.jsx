import React, { useState, useEffect } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import {  
  Users, Shield, LayoutDashboard, Settings, LogOut, Globe, 
  Plus, Search, Edit, Trash2, CheckCircle, AlertTriangle, X, Lock, 
  ChevronRight, GraduationCap, Utensils, CreditCard, Filter
, Bell , User } from 'lucide-react';
import api from '../../services/api';

export default function UserManagement() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const [lang, setLang] = useState('vi');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  // Get current user info for Sidebar permissions
  const currentUser = JSON.parse(localStorage.getItem('user')) || { role: 'Guest' };
  const userRole = currentUser.role;

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All'); // Role filtering state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '', password: '', fullName: '', role: 'Teacher', phone: '', status: 'Active', classRoom: '', studentName: '', studentClassRoom: ''
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data?.data || []);
    } catch (error) {
      showToast("Error loading data", "error");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/users/${editingId}`, formData);
        showToast("Updated successfully!", "success");
      } else {
        await api.post('/admin/users', formData);
        showToast("New account created!", "success");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      showToast(error.response?.data?.message || "Operation error", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showToast("Deleted!", "success");
      fetchUsers();
    } catch (error) { showToast("Delete error", "error"); }
  };

  // Data filtering logic (Search + Role dropdown)
  const filteredUsers = users.filter(item => 
    (item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || item.username?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterRole === 'All' || item.role === filterRole)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex  text-slate-700">
      
      {/* SIDEBAR - SYNCHRONIZED WITH OTHER PAGES */}
      <aside 
        onMouseEnter={() => setIsSidebarExpanded(true)} 
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 z-50 ${isSidebarExpanded ? 'w-64 shadow-sm' : 'w-20'}`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className={`font-bold text-lg tracking-tight text-slate-900 transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>ADMIN PORTAL</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-hidden">
          <NavItem icon={LayoutDashboard} label="Dashboard" expanded={isSidebarExpanded} onClick={() => navigate('/admin/dashboard')} />
          
          {userRole === 'Admin' && (
            <NavItem icon={Users} label="Users" active expanded={isSidebarExpanded} />
          )}
          
          <NavItem icon={GraduationCap} label="Students" expanded={isSidebarExpanded} onClick={() => navigate('/admin/students')} />
          <NavItem icon={Utensils} label="Menus" expanded={isSidebarExpanded} onClick={() => navigate('/admin/menus')} />
          
          {userRole === 'Admin' && (
            <NavItem icon={CreditCard} label="Payments" expanded={isSidebarExpanded} onClick={() => navigate('/admin/payments')} />
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <h2 className="font-semibold text-slate-400 text-xs hidden md:block uppercase tracking-wider">{currentUser.fullName} - {userRole}</h2>
          
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={18} /></button>
            
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
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
              <p className="text-slate-500 text-sm mt-1">Role assignments and system access management.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* SEARCH BAR */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm" 
                />
              </div>

              {/* ROLE FILTER */}
              <div className="relative hidden sm:block">
                <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                  <Filter size={16} />
                </div>
                <select 
                  value={filterRole} 
                  onChange={e => setFilterRole(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-semibold text-slate-600 appearance-none cursor-pointer"
                >
                  <option value="All">All roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Parent">Parent</option>
                </select>
              </div>

              {/* ADD NEW BUTTON */}
              <button 
                onClick={() => {
                  setEditingId(null); 
                  setFormData({username:'',password:'',fullName:'',role:'Teacher',phone:'',status:'Active', classRoom: '', studentName: '', studentClassRoom: ''}); 
                  setIsModalOpen(true);
                }} 
                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold shadow-md hover:bg-indigo-700 flex items-center gap-2 transition-all"
              >
                Add New
              </button>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Account</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Loading data...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium">No accounts found.</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="p-4 font-semibold text-slate-900">{user.fullName}</td>
                      <td className="p-4 text-slate-500 font-medium">@{user.username}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[11px] font-bold border border-indigo-100">
                          <Shield size={12}/>
                          {user.role} {user.role === 'Teacher' && user.classRoom ? ` - Class ${user.classRoom}` : ''}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${user.status==='Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {user.status === 'Active' ? 'Active' : 'Locked'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingId(user.id); 
                              setFormData({
                                username:user.username,
                                fullName:user.fullName,
                                role:user.role,
                                phone:user.phone,
                                status:user.status,
                                password:'',
                                classRoom: user.classRoom || '',
                                studentName: user.studentName || '',
                                studentClassRoom: user.studentClassRoom || ''
                              }); 
                              setIsModalOpen(true)
                            }} 
                            className="px-3 py-1 text-xs font-bold transition-colors"
                          >
                            <Edit size={16}/>
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)} 
                            disabled={user.role==='Admin'} 
                            className="px-3 py-1 text-xs font-bold disabled:opacity-0 transition-colors"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                {editingId ? 'Edit Account Information' : 'Create New Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <InputField label="Full Name" value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} placeholder="Ex: John Doe" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Username" value={formData.username} disabled={!!editingId} onChange={v => setFormData({...formData, username: v})} placeholder="Ex: johndoe" />
                <InputField label="Phone Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="090..." />
              </div>
              <InputField label="Password" type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} placeholder={editingId ? 'Leave blank to keep current password' : 'Enter at least 6 characters'} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value, classRoom: e.target.value !== 'Teacher' ? '' : formData.classRoom})} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Parent">Parent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Locked</option>
                  </select>
                </div>
              </div>

              {formData.role === 'Teacher' && (
                <div className="pt-2">
                  <InputField 
                    label="Homeroom Class (Required)" 
                    value={formData.classRoom} 
                    onChange={v => setFormData({...formData, classRoom: v})} 
                    placeholder="Ex: 1A" 
                  />
                </div>
              )}

              {formData.role === 'Parent' && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <InputField 
                    label="Student Name" 
                    value={formData.studentName} 
                    onChange={v => setFormData({...formData, studentName: v})} 
                    placeholder="Ex: John Doe Jr." 
                  />
                  <InputField 
                    label="Student Class" 
                    value={formData.studentClassRoom} 
                    onChange={v => setFormData({...formData, studentClassRoom: v})} 
                    placeholder="Ex: 1A" 
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 font-bold bg-indigo-600 text-white rounded shadow-sm shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[9999] px-6 py-3.5 rounded-md shadow-sm border flex items-center gap-3 transition-all duration-300 transform translate-x-0 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span className="font-bold text-sm pr-4">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: '' })}><X size={16} /></button>
        </div>
      )}

      
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}

// NavItem with whitespace-nowrap to prevent sidebar stretching
function NavItem({ icon: Icon, label, active, onClick, expanded }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-3 w-full p-3 rounded font-semibold text-[13px] transition-all relative group ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <span className={`whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
        {label}
      </span>
    </button>
  );
}

function InputField({ label, value, onChange, placeholder, disabled=false, type="text" }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors disabled:opacity-60"
      />
    </div>
  );
}