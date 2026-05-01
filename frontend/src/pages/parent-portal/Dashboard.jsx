import React, { useState, useEffect } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, 
  XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import {  
  Bell, User, Utensils, Calendar, 
  CreditCard, AlertTriangle, LogOut, ChevronRight, ChevronDown, Shield
 } from 'lucide-react';
import api from '../../services/api';

const pieColors = ['#bbf7d0', '#fef08a', '#fbcfe8', '#bfdbfe']; 

export default function Dashboard() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // STATE CHỨA DỮ LIỆU BIỂU ĐỒ TỪ BACKEND
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [upcomingMeals, setUpcomingMeals] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/login');
        return;
      }
      
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      try {
        const response = await api.get(`/students/parent/${parsedUser.UserID || parsedUser.id}`);
        
        if (response.data.data && response.data.data.length > 0) {
          const realStudents = await Promise.all(
            response.data.data.map(async (st) => {
              try {
                const detailRes = await api.get(`/students/dashboard/${st.StudentID || st.id}`);
                const d = detailRes.data.data;
                
                return {
                  id: d.StudentID || d.id || st.StudentID || st.id,
                  name: d.FullName || st.FullName,
                  class: d.ClassName || 'Chưa xếp lớp',
                  height: d.Height || st.Height || 0,
                  weight: d.Weight || st.Weight || 0,
                  // FIX DỊ ỨNG: Quét cả 2 API và check mọi kiểu chữ hoa/thường
                  hasAllergy: Boolean(d.HasAllergy ?? d.hasAllergy ?? st.HasAllergy ?? st.hasAllergy ?? false),
                  allergyNote: d.AllergyNote || d.allergyNote || st.AllergyNote || st.allergyNote || '',
                  registrationStatus: d.registrationStatus || 'Chưa đăng ký', 
                  totalMealsThisMonth: d.mealBalance || 0,
                  avgCalories: 0,
                  avatarUrl: ''
                };
              } catch (error) {
                return {
                  id: st.StudentID || st.id,
                  name: st.FullName,
                  class: 'Chưa xếp lớp',
                  height: st.Height || 0,
                  weight: st.Weight || 0,
                  hasAllergy: Boolean(st.HasAllergy ?? st.hasAllergy ?? false),
                  allergyNote: st.AllergyNote || st.allergyNote || '',
                  registrationStatus: 'Chưa đăng ký', 
                  totalMealsThisMonth: 0,
                  avgCalories: 0,
                  avatarUrl: ''
                };
              }
            })
          );

          setStudents(realStudents);
          if (!selectedStudent) {
            setSelectedStudent(realStudents[0]);
          } else {
            const updated = realStudents.find(s => s.id === selectedStudent.id);
            setSelectedStudent(updated || realStudents[0]);
          }
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu học sinh:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const handleUserUpdate = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, [navigate]);

  // GỌI API LẤY BIỂU ĐỒ KHI ĐỔI HỌC SINH
  useEffect(() => {
    if (!selectedStudent) return;

    const fetchStudentStats = async () => {
      try {
        // Gọi xuống Backend để lấy số liệu thật
        const statsRes = await api.get(`/students/dashboard-stats/${selectedStudent.id}`);
        const data = statsRes.data.data;
        
        setBarData(data.barData || []);
        setPieData(data.pieData || []);
        setLineData(data.lineData || []);
        setUpcomingMeals(data.upcomingMeals || []);
      } catch (error) {
        console.log("Backend chưa có dữ liệu biểu đồ cho học sinh này.");
        // Fallback rỗng để giao diện không sập
        setBarData([]);
        setPieData([]);
        setLineData([]);
        setUpcomingMeals([]);
      }
    };

    fetchStudentStats();
  }, [selectedStudent]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen bg-green-50 flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12  text-gray-800">
      
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            
            <span className="font-bold text-lg text-gray-900 hidden sm:block">Trần Đại Nghĩa Meal</span>
          </div>
          
          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-500">
            <span className="text-green-600 border-b-2 border-green-500 py-5 cursor-pointer">Tổng quan</span>
            <span onClick={() => navigate('/schedule')} className="hover:text-gray-900 py-5 cursor-pointer transition-colors">Thực đơn</span>
            <span onClick={() => navigate('/registrations')} className="hover:text-gray-900 py-5 cursor-pointer transition-colors">Thanh toán</span>
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
                  <button onClick={() => navigate('/onboarding', { state: { allowUpdate: true } })} className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors font-semibold">Sửa hồ sơ bé</button>
                  <button onClick={() => setIsProfileModalOpen(true)} className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors font-semibold">Thay đổi mật khẩu</button>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded transition-colors font-bold mt-1">Đăng xuất</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {students.length > 1 && (
          <div className="flex justify-end animate-in fade-in">
            <div className="relative inline-block text-left w-64">
              <select 
                className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 focus:ring-green-500 focus:border-green-500 rounded shadow-sm appearance-none bg-white font-medium text-gray-700 cursor-pointer"
                value={selectedStudent?.id}
                onChange={(e) => {
                  const student = students.find(s => s.id === parseInt(e.target.value));
                  setSelectedStudent(student);
                }}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>👦👧 {s.name} - Lớp {s.class}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-md p-6 shadow-sm border border-gray-100 flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center border-2 border-green-100 flex-shrink-0 overflow-hidden shadow-inner">
              <img 
                src={
                  selectedStudent?.avatarUrl || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent?.name || 'HS')}&background=bbf7d0&color=166534&size=80`
                } 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{selectedStudent?.name || 'Đang cập nhật...'}</h2>
              <p className="text-gray-500 text-sm mt-1">Lớp {selectedStudent?.class} • Tiểu học Trần Đại Nghĩa</p>
              
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200 shadow-sm">
                  {selectedStudent?.height} cm • {selectedStudent?.weight} kg
                </span>
                
                {selectedStudent?.hasAllergy ? (
                  <div className="inline-flex items-center space-x-1.5 bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-xs font-medium border border-pink-100 shadow-sm">
                    <Shield size={12} />
                    <span>Dị ứng: {selectedStudent?.allergyNote || 'Đã ghi nhận'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-100 shadow-sm">
                    <span>Không có dị ứng</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100 flex flex-col justify-center space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Thao tác nhanh</h3>
            <button 
              onClick={() => navigate('/registrations')} 
              className="w-full flex items-center justify-between bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2.5 rounded text-sm font-medium transition-colors shadow-sm"
            >
              <span>Đăng ký suất ăn</span>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => navigate('/schedule')} className="w-full flex items-center justify-between bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-4 py-2.5 rounded text-sm font-medium transition-colors shadow-sm">
              <span>Xem thực đơn tuần</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-green-50 text-green-600 rounded"><Calendar size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Đã ăn tuần này</p>
              <p className="text-2xl font-bold text-gray-900">{barData.reduce((acc, curr) => acc + curr.meals, 0)} / 5 bữa</p>
            </div>
          </div>
          <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded"><Utensils size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Trạng thái đăng ký</p>
              <p className={`text-lg font-bold ${
                selectedStudent?.registrationStatus === 'Chưa đăng ký' ? 'text-red-500' : 
                selectedStudent?.registrationStatus === 'Chờ thanh toán' ? 'text-orange-500' : 'text-green-600'
              }`}>
                {selectedStudent?.registrationStatus}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-pink-50 text-pink-600 rounded"><CreditCard size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Số dư bữa ăn</p>
              <p className="text-2xl font-bold text-gray-900">{selectedStudent?.totalMealsThisMonth || 0} bữa</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">Lịch sử ăn (Tuần này)</h3>
            <div className="h-48">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Bar dataKey="meals" fill="#bbf7d0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">Chưa có dữ liệu ăn tuần này</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Phân bổ loại món</h3>
            <div className="h-48 flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-gray-400">Chưa có dữ liệu thống kê món</div>
              )}
            </div>
            {pieData.length > 0 && (
              <div className="flex justify-center space-x-4 mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: pieColors[i % pieColors.length] }}></span>
                    {entry.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">Xu hướng đăng ký tháng</h3>
            <div className="h-48">
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Line type="monotone" dataKey="orders" stroke="#fbcfe8" strokeWidth={3} dot={{ r: 4, fill: '#fbcfe8', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                 <div className="flex items-center justify-center h-full text-sm text-gray-400">Chưa có dữ liệu xu hướng</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900">Bữa ăn sắp tới</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Ngày</th>
                  <th className="px-6 py-4 font-medium">Loại thực đơn</th>
                  <th className="px-6 py-4 font-medium Trạng thái">Trạng thái</th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upcomingMeals.length > 0 ? (
                  upcomingMeals.map((meal) => (
                    <tr key={meal.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{meal.date}</td>
                      <td className="px-6 py-4 text-gray-600">{meal.type}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          meal.status === 'Đã chốt' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          {meal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => navigate('/schedule')} className="text-green-600 hover:text-green-800 font-medium transition-colors flex items-center justify-end w-full">
                          Chi tiết <ChevronRight size={14} className="ml-1"/>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400 italic">
                      Không có bữa ăn nào sắp tới. Vui lòng đăng ký và chọn món.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}