import React, { useState, useEffect } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import {   
  Users, Shield, LayoutDashboard, LogOut, Globe, 
  Plus, Search, Edit, Trash2, CheckCircle, AlertTriangle, X, 
  GraduationCap, Utensils, CreditCard, Filter
, Bell  , User } from 'lucide-react';
import api from '../../services/api';

export default function StudentManagement() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const [lang, setLang] = useState('vi');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem('user')) || { role: 'Guest' };
  const userRole = currentUser.role;

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('Tất cả'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // [ĐÃ SỬA]: Thêm height và weight vào formData
  const [formData, setFormData] = useState({
    fullName: '', classRoom: '', parentId: '', allergies: '', status: 'Registered', height: '', weight: ''
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const t = {
    title: "Hồ sơ học sinh",
    subtitle: userRole === 'Teacher' ? "Quản lý danh sách học sinh lớp chủ nhiệm." : "Quản lý danh sách học sinh, lớp học và ghi chú dị ứng toàn trường.",
    searchPlh: "Tìm tên học sinh...",
    addBtn: "Thêm Học sinh",
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/students');
      setStudents(res.data?.data || []);
    } catch (error) {
      showToast("Không thể tải danh sách học sinh", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, formData);
        showToast("Cập nhật thông tin thành công!");
      } else {
        await api.post('/students', formData);
        showToast("Đã thêm học sinh mới!");
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (error) {
      showToast("Lỗi khi lưu dữ liệu", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa hồ sơ học sinh này vĩnh viễn?")) return;
    try {
      await api.delete(`/students/${id}`);
      showToast("Đã xóa hồ sơ học sinh");
      fetchStudents();
    } catch (error) {
      showToast("Lỗi khi xóa", "error");
    }
  };

  const uniqueClasses = [...new Set(students.map(s => s.classRoom))].filter(Boolean).sort();

  const filteredStudents = students.filter(s => {
    const matchSearch = s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.classRoom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass === 'Tất cả' || s.classRoom === filterClass;
    return matchSearch && matchClass;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex  text-slate-700">
      
      {/* SIDEBAR */}
      <aside 
        onMouseEnter={() => setIsSidebarExpanded(true)} 
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 z-50 ${isSidebarExpanded ? 'w-64 shadow-sm' : 'w-20'}`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shrink-0 shadow-sm"><Shield size={20}/></div>
          <span className={`font-bold text-lg tracking-tight text-slate-900 transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>TMS ADMIN</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-hidden">
          {userRole === 'Admin' && <NavItem icon={LayoutDashboard} label="Dashboard" expanded={isSidebarExpanded} onClick={() => navigate('/admin/dashboard')} />}
          {userRole === 'Admin' && <NavItem icon={Users} label="Người dùng" expanded={isSidebarExpanded} onClick={() => navigate('/admin/users')} />}
          <NavItem icon={GraduationCap} label="Học sinh" active expanded={isSidebarExpanded} onClick={() => navigate('/admin/students')} />
          {userRole === 'Admin' && <NavItem icon={Utensils} label="Thực đơn" expanded={isSidebarExpanded} onClick={() => navigate('/admin/menus')} />}
          {(userRole === 'Admin' || userRole === 'Teacher') && <NavItem icon={CreditCard} label="Thanh toán" expanded={isSidebarExpanded} onClick={() => navigate('/admin/payments')} />}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <h2 className="font-semibold text-slate-400 text-xs hidden md:block uppercase tracking-wider">{currentUser.fullName} - {userRole}</h2>
          
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
                  <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded transition-colors font-bold mt-1">Đăng xuất</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.title}</h1>
              <p className="text-slate-500 text-sm mt-1">{t.subtitle}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" placeholder={t.searchPlh} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm"/>
              </div>

              {userRole === 'Admin' && (
                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"><Filter size={16} /></div>
                  <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-semibold text-slate-600 appearance-none cursor-pointer">
                    <option value="Tất cả">Tất cả lớp</option>
                    {uniqueClasses.map(c => (<option key={c} value={c}>Lớp {c}</option>))}
                  </select>
                </div>
              )}

              {userRole === 'Admin' && (
                <button 
                  onClick={() => { 
                    setEditingId(null); 
                    setFormData({ fullName: '', classRoom: '', parentId: '', allergies: '', status: 'Registered', height: '', weight: '' });
                    setIsModalOpen(true); 
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-indigo-700 flex items-center shadow-md transition-all"
                >
                  Thêm mới
                </button>
              )}
            </div>
          </div>

          <section className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-4">Họ và Tên</th>
                    <th className="p-4">Lớp</th>
                    <th className="p-4">Thể chất</th> {/* [MỚI]: Cột thể chất */}
                    <th className="p-4">Ghi chú Dị ứng</th>
                    <th className="p-4 text-center">Bán trú</th>
                    {userRole === 'Admin' && <th className="p-4 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {isLoading ? (
                    <tr><td colSpan={userRole === 'Admin' ? "6" : "5"} className="p-10 text-center text-slate-400 italic">Đang tải hồ sơ học sinh...</td></tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr><td colSpan={userRole === 'Admin' ? "6" : "5"} className="p-10 text-center text-slate-400 font-medium">Chưa có học sinh nào.</td></tr>
                  ) : filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{student.fullName}</p>
                        <p className="text-[10px] text-slate-400">PH: {student.parentName}</p>
                      </td>
                      <td className="p-4 text-slate-600 font-bold">{student.classRoom}</td>
                      
                      {/* [MỚI]: Render cột thể chất */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-slate-600 text-xs font-semibold">{student.height ? `${student.height} cm` : '-- cm'}</span>
                          <span className="text-slate-500 text-[11px]">{student.weight ? `${student.weight} kg` : '-- kg'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        {student.allergies ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-pink-50 text-pink-600 text-[11px] font-bold border border-pink-100">
                             {student.allergies}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs font-normal">Không</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${student.status === 'Registered' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {student.status === 'Registered' ? 'Đang hoạt động' : 'Nghỉ'}
                        </span>
                      </td>
                      
                      {userRole === 'Admin' && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingId(student.id);
                                setFormData({
                                  fullName: student.fullName, classRoom: student.classRoom,
                                  allergies: student.allergies, status: student.status, parentId: '',
                                  height: student.height, weight: student.weight // Truyền dữ liệu cũ vào form
                                });
                                setIsModalOpen(true);
                              }}
                              className="px-3 py-1 text-xs font-bold transition-colors"
                            >
                              <Edit size={16}/>
                            </button>
                            <button onClick={() => handleDelete(student.id)} className="px-3 py-1 text-xs font-bold transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* MODAL THÊM/SỬA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                {editingId ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Họ và Tên</label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-indigo-500" placeholder="VD: Nguyễn Minh Anh"/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lớp</label>
                    <input required type="text" value={formData.classRoom} onChange={e => setFormData({...formData, classRoom: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-indigo-500" placeholder="VD: 1A"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái Bán trú</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none bg-white">
                      <option value="Registered">Đang hoạt động</option><option value="Not_Registered">Chưa đăng ký</option>
                    </select>
                  </div>
                </div>

                {/* [MỚI]: Row nhập Chiều cao, Cân nặng */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chiều cao (cm)</label>
                    <input type="number" min="0" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-indigo-500" placeholder="VD: 120"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cân nặng (kg)</label>
                    <input type="number" min="0" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-indigo-500" placeholder="VD: 25"/>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ghi chú Dị ứng (nếu có)</label>
                  <input type="text" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-indigo-500" placeholder="VD: Tôm, Đậu phộng..."/>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded transition-all">Hủy</button>
                  <button type="submit" className="flex-1 py-2.5 font-bold bg-indigo-600 text-white rounded shadow-sm shadow-indigo-100 hover:bg-indigo-700 transition-all">Lưu hồ sơ</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`fixed top-5 right-5 z-[9999] px-6 py-3.5 rounded-md shadow-sm border flex items-center gap-3 transition-all duration-300 ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span className="font-bold text-sm pr-4">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: '' })}><X size={16} /></button>
        </div>
      )}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, expanded }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded font-semibold text-[13px] transition-all relative group ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
      <Icon size={18} className="shrink-0" />
      <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{label}</span>
      {!expanded && <div className="absolute left-16 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100]">{label}</div>}
    </button>
  );
}