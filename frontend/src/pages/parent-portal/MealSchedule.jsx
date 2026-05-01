import ProfileModal from '../../components/ProfileModal';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, Lock, AlertTriangle, Shield, Flame, Info, X, Building, CheckCircle, Search, Utensils, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import api from '../../services/api';

export default function MealSchedule() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState([]);
  
  const [monthStatuses, setMonthStatuses] = useState({});
  const [selections, setSelections] = useState({}); 
  const [isLoading, setIsLoading] = useState(true);

  const [weeklyMenu, setWeeklyMenu] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [selectedDish, setSelectedDish] = useState(null);

  useEffect(() => {
    const getDaysInWeek = (date) => {
      const day = date.getDay(); 
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
      const monday = new Date(date.setDate(diff));
      const days = [];
      for (let i = 0; i < 5; i++) { 
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        days.push(nextDay);
      }
      return days;
    };
    setWeekDays(getDaysInWeek(new Date(currentDate)));
  }, [currentDate]);

  useEffect(() => {
    const fetchStudentsAndData = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return navigate('/login');
      
      try {
        const studentRes = await api.get(`/students/parent/${user.UserID || user.id}`);
        const studentList = studentRes.data.data;
        setStudents(studentList);
        
        const activeStudent = selectedStudent || (studentList.length > 0 ? (studentList[0].StudentID || studentList[0].id) : null);
        if (!selectedStudent && activeStudent) setSelectedStudent(activeStudent);

        if (activeStudent && weekDays.length > 0) {
          setIsLoading(true);
          const targetMonths = [...new Set(weekDays.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`))];
          const newStatuses = {};
          const newSelections = {};

          let isWeekPaid = false;

          for (const mStr of targetMonths) {
            try {
              const regRes = await api.get(`/registrations/context?studentId=${activeStudent}&month=${mStr}`);
              const isPaid = regRes.data.registrationStatus === 'Paid';
              newStatuses[mStr] = isPaid;

              if (isPaid) {
                isWeekPaid = true;
                const selRes = await api.get(`/schedule/selections?studentId=${activeStudent}&month=${mStr}`);
                if (Array.isArray(selRes.data.data)) {
                  selRes.data.data.forEach(item => { 
                    // CHÍNH LÀ CHỖ NÀY ĐÂY: Cắt đuôi "T00:00..." của Database, chỉ lấy 10 ký tự YYYY-MM-DD
                    const cleanDate = item.Date ? String(item.Date).substring(0, 10) : '';
                    if (cleanDate) {
                        newSelections[cleanDate] = item.MealType; 
                    }
                  });
                }
              }
            } catch (e) {
              newStatuses[mStr] = false; 
            }
          }
          
          setMonthStatuses(newStatuses);
          setSelections(newSelections);

          if (isWeekPaid) {
            try {
              const menuRes = await api.get('/schedule/weekly-menu');
              setWeeklyMenu(menuRes.data.data || {});
            } catch (e) {
              setWeeklyMenu({}); 
            }
          }
          setIsLoading(false);
        }
      } catch (err) {
        setIsLoading(false);
      }
    };
    fetchStudentsAndData();
  }, [selectedStudent, weekDays, navigate]);

  const checkIsLocked = (targetDate) => {
    const now = new Date();
    const deadline = new Date(targetDate);
    deadline.setDate(deadline.getDate() - 1); 
    deadline.setHours(20, 0, 0, 0); 
    return now > deadline;
  };

  const handleSelectMeal = async (dateString, type) => {
    const dayMonth = dateString.substring(0, 7);
    if (checkIsLocked(new Date(dateString)) || !monthStatuses[dayMonth]) return;
    
    setSelections(prev => ({ ...prev, [dateString]: type }));
    setSaveStatus(prev => ({ ...prev, [dateString]: 'saving' }));

    try {
      await api.post('/schedule/selections', { studentId: selectedStudent, date: dateString, mealType: type });
      setSaveStatus(prev => ({ ...prev, [dateString]: 'success' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [dateString]: null })), 3000);
    } catch (err) {
      setSaveStatus(prev => ({ ...prev, [dateString]: 'error' }));
      alert("Lỗi mạng khi lưu món ăn. Vui lòng thử lại!");
    }
  };

  const currentStudentData = students.find(s => (s.StudentID || s.id) == selectedStudent);

  const checkAllergyWarning = (dishAllergens) => {
    if (!currentStudentData?.hasAllergy || !currentStudentData?.allergyNote || !Array.isArray(dishAllergens)) return false;
    const studentNote = String(currentStudentData.allergyNote).toLowerCase();
    return dishAllergens.some(allergen => studentNote.includes(String(allergen).toLowerCase()));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderDishTypeBadge = (type) => {
    const colors = {
      'Món mặn': 'bg-red-50 text-red-700 border-red-200',
      'Món rau': 'bg-green-50 text-green-700 border-green-200',
      'Món canh': 'bg-blue-50 text-blue-700 border-blue-200',
      'Món phụ': 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[type] || 'bg-gray-100 text-gray-600'}`}>{type}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12  text-gray-800 relative">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-gray-900 hidden sm:block">Trần Đại Nghĩa Meal</span>
          </div>
          
          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-500">
            <span onClick={() => navigate('/parent/dashboard')} className="hover:text-gray-900 py-5 cursor-pointer transition-colors">Tổng quan</span>
            <span className="text-green-600 border-b-2 border-green-500 py-5 cursor-pointer">Thực đơn</span>
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

      <main className="max-w-4xl mx-auto px-4 mt-6">
        
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <select className="w-full sm:w-1/3 border-gray-300 rounded bg-gray-50 font-medium py-2 px-3" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
            {students.map(s => <option key={s.id || s.StudentID} value={s.id || s.StudentID}>{s.FullName}</option>)}
          </select>
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronLeft size={20}/></button>
            <div className="font-bold text-green-700 bg-green-50 px-4 py-2 rounded border border-green-100 flex items-center">
              <Calendar size={18} className="mr-2" />
              Tuần {weekDays[0]?.getDate()}/{weekDays[0]?.getMonth()+1} - {weekDays[4]?.getDate()}/{weekDays[4]?.getMonth()+1}
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronRight size={20}/></button>
          </div>
        </div>

        {currentStudentData?.hasAllergy && (
          <div className="bg-pink-50 border border-pink-200 rounded p-4 mb-6 flex items-start space-x-3 shadow-sm">
            <Shield className="text-pink-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-bold text-pink-800">Lưu ý Dị ứng: {currentStudentData?.allergyNote}</h4>
              <p className="text-sm text-pink-700 mt-1">Hệ thống tự động cảnh báo các món ăn có chứa thành phần trên. Bếp ăn cũng đã ghi nhận thông tin này.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-gray-500 font-medium animate-pulse">Đang tải dữ liệu thực đơn từ hệ thống...</div>
        ) : !monthStatuses[`${weekDays[0]?.getFullYear()}-${String(weekDays[0]?.getMonth() + 1).padStart(2, '0')}`] ? (
          <div className="bg-white p-8 sm:p-10 rounded-md shadow-sm border border-orange-200 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-orange-400"></div>
            <Lock className="mx-auto text-orange-400 mb-4" size={56} />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Thực đơn Tuần này bị khóa</h2>
            <p className="text-gray-600 mb-4">Bạn chưa hoàn tất thanh toán suất ăn cho <strong>Tháng {weekDays[0]?.getMonth() + 1}</strong>.</p>
            <button onClick={() => navigate('/registrations')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded transition-all shadow-sm w-full sm:w-auto">
              Kiểm tra tình trạng Đăng ký
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {weekDays.map((date) => {
              const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const dayMonth = dateString.substring(0, 7); 
              const isDayPaid = monthStatuses[dayMonth]; 
              const isLocked = checkIsLocked(date);
              
              // Frontend đọc chuẩn xác 100% nhờ đã cắt đuôi T00:00:00
              const currentChoice = selections[dateString]; 
              
              const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
              const dayIndex = date.getDay();
              
              // [ĐỒNG BỘ]: Lấy thực đơn thật từ database theo đúng ngày (dateString)
              const menuData = weeklyMenu[dateString] || { totalCalories: 0, standardDishes: [], vegetarianDishes: [] };
              
              const rawActiveDishes = currentChoice === 'Vegetarian' ? menuData.vegetarianDishes : menuData.standardDishes;
              const activeDishes = Array.isArray(rawActiveDishes) ? rawActiveDishes : [];
              
              const isHoliday = (date.getDate() === 30 && date.getMonth() === 3) || (date.getDate() === 1 && date.getMonth() === 4);

              if (isHoliday) {
                return (
                  <div key={dateString} className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden opacity-70">
                     <div className="px-5 py-3 bg-gray-100 font-bold text-gray-500">{dayNames[dayIndex]} - {date.toLocaleDateString('vi-VN')}</div>
                     <div className="p-8 text-center text-gray-500 font-medium">🌴 Ngày nghỉ Lễ - Không phục vụ suất ăn</div>
                  </div>
                );
              }

              return (
                <div key={dateString} className={`bg-white rounded-md border ${!isDayPaid ? 'border-orange-200' : isLocked ? 'border-gray-200 opacity-90' : 'border-green-200 shadow-md'} overflow-hidden transition-all flex flex-col md:flex-row`}>
                  
                  <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 p-5 relative">
                    {!isDayPaid && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                        <Lock size={40} className="text-orange-400 mb-3" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa thanh toán Tháng {dayMonth.split('-')[1]}</h3>
                        <p className="text-sm text-gray-600 mb-4">Vui lòng đăng ký suất ăn tháng để xem chi tiết thực đơn và chọn món.</p>
                        <button onClick={() => navigate('/registrations')} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2.5 px-6 rounded shadow-sm">
                          Đăng ký ngay
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                      <div>
                        <span className={`font-bold text-lg ${!isDayPaid ? 'text-orange-800' : isLocked ? 'text-gray-600' : 'text-green-800'}`}>
                          {dayNames[dayIndex]} {currentChoice === 'Vegetarian' && <span className="text-yellow-600 text-sm ml-2">(Thực đơn Chay)</span>}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">{date.toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center text-orange-500 bg-orange-50 px-3 py-1 rounded-full text-sm font-bold border border-orange-100">
                        <Flame size={16} className="mr-1" /> {menuData.totalCalories || 0} kcal
                      </div>
                    </div>

                    <div className="space-y-3 animate-in fade-in duration-300" key={currentChoice}>
                      {activeDishes.length > 0 ? (
                        activeDishes.map((dish) => {
                          const hasAllergyWarning = checkAllergyWarning(dish.allergens);
                          
                          return (
                            <div key={dish.id} 
                               onClick={() => {
                                 if(isDayPaid) setSelectedDish(dish);
                               }}
                               className={`flex items-start justify-between p-3 rounded border cursor-pointer transition-all active:scale-95
                                ${hasAllergyWarning ? 'bg-pink-50 border-pink-200 hover:border-pink-400 hover:shadow-md' : 'bg-gray-50 border-gray-100 hover:border-green-400 hover:shadow-md'}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  {renderDishTypeBadge(dish.type)}
                                  <h4 className={`font-bold text-sm ${hasAllergyWarning ? 'text-pink-900' : 'text-gray-800'}`}>{dish.name}</h4>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Flame size={12} className="mr-1 text-gray-400" /> {dish.calories} kcal
                                </div>
                                {hasAllergyWarning && Array.isArray(dish.allergens) && (
                                  <p className="text-[11px] text-pink-600 font-medium mt-1.5 flex items-center">
                                     Có chứa: {dish.allergens.join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-center justify-center bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 shadow-sm ml-3 transition-colors hover:bg-blue-50">
                                <Search size={16} className="mb-1"/> Xem
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-gray-400 italic text-sm">Nhà bếp đang cập nhật thực đơn cho ngày này...</div>
                      )}
                    </div>
                  </div>

                  <div className={`w-full md:w-64 p-5 flex flex-col justify-center ${!isDayPaid ? 'bg-orange-50/30' : 'bg-gray-50/50'} relative`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-700 text-sm uppercase tracking-wider">Lựa chọn của bạn</span>
                      {isLocked ? (
                        <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded border"><Clock size={10} className="inline mr-1"/> ĐÃ CHỐT</span>
                      ) : (
                        <span className="text-[10px] font-bold text-orange-600 bg-white px-2 py-1 rounded border border-orange-200 shadow-sm"><Clock size={10} className="inline mr-1"/> 20:00 HÔM TRƯỚC</span>
                      )}
                    </div>

                    {!currentChoice && !isLocked && isDayPaid && (
                      <div className="mb-3 text-xs text-blue-700 font-medium text-center bg-blue-100 p-2 rounded-lg border border-blue-200">
                        Hệ thống mặc định: Suất Mặn
                      </div>
                    )}

                    <div className="flex flex-col space-y-3">
                      <button onClick={() => handleSelectMeal(dateString, 'Standard')} disabled={isLocked || !isDayPaid} 
                        className={`relative p-3 rounded border-2 text-left transition-all flex items-center
                          ${currentChoice === 'Standard' || (!currentChoice && isLocked && isDayPaid) ? 'border-green-500 bg-green-100 text-green-900 shadow-sm' : 'border-gray-200 bg-white hover:border-green-300 text-gray-600'}
                          ${(isLocked || !isDayPaid) && currentChoice === 'Vegetarian' ? 'opacity-40' : ''}
                        `}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${currentChoice === 'Standard' || (!currentChoice && isLocked && isDayPaid) ? 'border-green-600' : 'border-gray-300'}`}>
                          {(currentChoice === 'Standard' || (!currentChoice && isLocked && isDayPaid)) && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
                        </div>
                        <span className="font-bold">Suất Mặn</span>
                      </button>

                      <button onClick={() => handleSelectMeal(dateString, 'Vegetarian')} disabled={isLocked || !isDayPaid} 
                        className={`relative p-3 rounded border-2 text-left transition-all flex items-center
                          ${currentChoice === 'Vegetarian' ? 'border-yellow-500 bg-yellow-100 text-yellow-900 shadow-sm' : 'border-gray-200 bg-white hover:border-yellow-300 text-gray-600'}
                          ${(isLocked || !isDayPaid) && currentChoice !== 'Vegetarian' ? 'opacity-40' : ''}
                        `}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${currentChoice === 'Vegetarian' ? 'border-yellow-600' : 'border-gray-300'}`}>
                          {currentChoice === 'Vegetarian' && <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>}
                        </div>
                        <span className="font-bold">Suất Chay</span>
                      </button>
                    </div>

                    {saveStatus[dateString] === 'success' && (
                      <div className="mt-4 text-center text-sm font-bold text-green-700 bg-green-100 p-2 rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-2">
                        Đã lưu suất {currentChoice === 'Standard' ? 'Mặn' : 'Chay'}!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* POPUP CHI TIẾT MÓN ĂN */}
      {selectedDish && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-md max-w-md w-full overflow-hidden shadow-sm scale-in-center">
            
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-start">
              <div>
                {renderDishTypeBadge(selectedDish.type)}
                <h3 className="text-xl font-bold text-gray-900 mt-2">{selectedDish.name}</h3>
                <div className="text-sm text-orange-600 font-bold mt-1 flex items-center">
                  <Flame size={16} className="mr-1" /> {selectedDish.calories || 0} kcal
                </div>
              </div>
              <button onClick={() => setSelectedDish(null)} className="p-2 bg-gray-200 hover:bg-red-100 hover:text-red-600 rounded-full text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider flex items-center">
                  <Utensils size={16} className="mr-2 text-green-600" /> Nguyên liệu chính
                </h4>
                <p className="text-gray-700 bg-green-50 p-4 rounded border border-green-100 leading-relaxed text-sm font-medium">
                  {selectedDish.ingredients || 'Đang cập nhật...'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider flex items-center">
                  <Building size={16} className="mr-2 text-blue-600" /> Nguồn cung cấp
                </h4>
                <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded border border-blue-100">
                  <img 
                    src={selectedDish.supplierLogo || 'https://placehold.co/100x100/3B82F6/FFF?text=NCC'} 
                    alt="Logo NCC" 
                    className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover bg-white" 
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src = 'https://placehold.co/100x100/9CA3AF/FFF?text=NCC'; 
                    }}
                  />
                  <div>
                    <p className="font-bold text-blue-900 text-base">{selectedDish.supplier || 'Đang cập nhật...'}</p>
                    <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-100 inline-block px-2 py-0.5 rounded">
                      Đối tác chuẩn VietGAP
                    </p>
                  </div>
                </div>
              </div>

              {Array.isArray(selectedDish.allergens) && selectedDish.allergens.length > 0 && (
                <div className="bg-pink-50 p-4 rounded border border-pink-200">
                  <h4 className="text-sm font-bold text-pink-900 mb-2 flex items-center">
                    <Shield size={16} className="mr-2" /> Thành phần dễ gây dị ứng
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDish.allergens.map((allergen, idx) => (
                      <span key={idx} className="bg-white border border-pink-200 text-pink-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
               <button onClick={() => setSelectedDish(null)} className="w-full py-3 bg-gray-800 text-white font-bold rounded hover:bg-gray-900 transition-colors">
                 Đóng
               </button>
            </div>

          </div>
        </div>
      )}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}