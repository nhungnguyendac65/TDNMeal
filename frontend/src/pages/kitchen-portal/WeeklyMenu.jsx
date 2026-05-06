import React, { useState, useEffect, useMemo } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar, LayoutDashboard, List, LogOut, Globe, Plus,
  Package, Users, Utensils, ChevronLeft, ChevronRight,
  CheckCircle, AlertTriangle, Clock, ArrowRight, Loader2
, User } from 'lucide-react';
import api from '../../services/api';

/**
 * Helper function: Gets an array of 7 dates for a given week, starting from Monday.
 */
const getWeekDates = (currentDate) => {
  const start = new Date(currentDate);
  const day = start.getDay();

  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(start);
    nextDay.setDate(start.getDate() + i);
    week.push(nextDay);
  }
  return week;
};

/**
 * Helper function: Formats a Date object to a YYYY-MM-DD string.
 */
const formatDateStr = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function WeeklyMenu() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const [lang, setLang] = useState('en');

  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [weeklyData, setWeeklyData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const minDate = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToNextMonday = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + diffToNextMonday);
    return formatDateStr(nextMonday);
  }, []);

  const weekDays = getWeekDates(currentWeekStart);

  useEffect(() => {
    const fetchWeeklyMenus = async () => {
      setIsLoading(true);
      const newData = {};

      try {

        const startStr = formatDateStr(weekDays[0]);
        const endStr = formatDateStr(weekDays[6]);

        const res = await api.get(`/menus?startDate=${startStr}&endDate=${endStr}`);

        if (res.data && res.data.data) {
          res.data.data.forEach(menu => {

            newData[menu.date] = menu;
          });
        }

        setWeeklyData(newData);
      } catch (error) {
        console.error("Error loading weekly menu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyMenus();
  }, [currentWeekStart]); 

  /**
 * Component Handlers
 */
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const prevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToday = () => setCurrentWeekStart(new Date());

  const getDayName = (date, lang) => {
    const daysVi = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return lang === 'vi' ? daysVi[date.getDay()] : daysEn[date.getDay()];
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">Approved</span>;
      case 'Submitted':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
      case 'Rejected':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">Draft</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col  text-gray-800 pb-12">

      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-gray-900 hidden sm:block">Kitchen Management</span>
          </div>
          <div className="hidden lg:flex space-x-6 text-sm font-semibold text-gray-500 h-full">
            <Link to="/kitchen/dashboard" className="hover:text-orange-600 h-full flex items-center transition-colors">Overview</Link>
            <span onClick={() => navigate('/kitchen/create-menu')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              <Plus size={16} className="mr-1.5" /> {lang === 'vi' ? 'Tạo thực đơn ngày' : 'Create daily menu'}
            </span>            <span className="text-orange-600 border-b-2 border-orange-500 h-full flex items-center cursor-default"><Calendar size={16} className="mr-1.5" /> Thực đơn tuần</span>
            <Link to="/kitchen/dishes" className="hover:text-orange-600 h-full flex items-center transition-colors"><List size={16} className="mr-1.5" /> Món ăn</Link>
            <span onClick={() => navigate('/kitchen/ingredients')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              Ingredients
            </span>          </div>
          <div className="flex items-center space-x-3 text-gray-400">

            <button onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} className="flex items-center space-x-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200 hover:bg-gray-200 transition-colors shadow-sm">
              <span>{lang === 'en' ? 'EN' : 'VN'}</span>
            </button>
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
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded transition-colors font-bold mt-1">Logout</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* 2. TOOLBAR (Change Week) */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-20">
        <div className="max-w-[1500px] mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Menu</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Overview of the cooking schedule, control empty days for timely preparation.</p>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded border border-gray-200 shadow-inner">
            <button onClick={prevWeek} className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm">
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 font-bold text-gray-800 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-orange-500" />
              {weekDays[0].toLocaleDateString('en-US')} - {weekDays[6].toLocaleDateString('en-US')}
            </div>
            <button onClick={nextWeek} className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm">
              <ChevronRight size={18} />
            </button>
            <button onClick={goToday} className="ml-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors shadow-sm">
              Today
            </button>
          </div>
        </div>
      </div>

      {/* 3. 7-DAY GRID (MONDAY -> SUNDAY) */}
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-[1500px] mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-gray-400">
            <Loader2 size={40} className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {weekDays.map((date, index) => {
              const dateStr = formatDateStr(date);
              const menuData = weeklyData[dateStr];
              const isWeekend = date.getDay() === 0 || date.getDay() === 6; 
              const isToday = dateStr === formatDateStr(new Date());

              return (
                <div key={dateStr} className={`flex flex-col rounded-md border-2 transition-all shadow-sm overflow-hidden ${isToday ? 'border-orange-400 shadow-orange-100' :
                  (isWeekend ? 'border-gray-200 bg-gray-50/50' : 'border-gray-200 bg-white hover:border-gray-300')
                  }`}>

                  {/* Day Header */}
                  <div className={`px-4 py-3 border-b flex justify-between items-center ${isToday ? 'bg-orange-50 border-orange-200' : 'bg-gray-50/80 border-gray-100'}`}>
                    <div>
                      <p className={`text-sm font-bold uppercase ${isWeekend ? 'text-gray-400' : (isToday ? 'text-orange-700' : 'text-gray-700')}`}>
                        {getDayName(date, lang)}
                      </p>
                      <p className={`text-xs font-medium mt-0.5 ${isWeekend ? 'text-gray-400' : (isToday ? 'text-orange-600' : 'text-gray-500')}`}>
                        {date.toLocaleDateString('en-US')}
                      </p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    {menuData ? (
                      <div className="flex flex-col h-full animate-in fade-in">
                        <div className="mb-4">
                          {renderStatus(menuData.status)}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-4">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Dinh dưỡng (Chuẩn)</p>
                          <p className="text-lg font-black text-orange-600">{menuData.totalCalories || 0} <span className="text-xs font-bold text-gray-400">kcal</span></p>
                        </div>

                        {menuData.status === 'Rejected' && (
                          <div className="mb-4 p-2 bg-red-50 rounded border border-red-100 text-[10px] text-red-600 font-medium">
                            ⚠ {menuData.rejectReason || 'Cần sửa đổi'}
                          </div>
                        )}

                        <div className="mt-auto">
                          <Link
                            to={`/kitchen/create-menu?date=${dateStr}&view=true`}
                            className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 flex justify-center items-center gap-1.5 hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            Details <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-60">
                        {isWeekend ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2"><Utensils size={16} className="text-gray-400" /></div>
                            <p className="text-xs font-bold text-gray-400">Weekend</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-3 text-orange-400"></div>
                            <p className="text-xs font-bold text-gray-500 mb-4">Chưa có thực đơn</p>

                            {/* KHÓA: KHÔNG CHO TẠO MENU Ở TUẦN HIỆN TẠI VÀ QUÁ KHỨ */}
                            {dateStr < minDate ? (
                              <div className="w-full py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-bold flex justify-center items-center shadow-sm cursor-not-allowed">
                                Locked
                              </div>
                            ) : (
                              <Link
                                to={`/kitchen/create-menu?date=${dateStr}`}
                                className="w-full py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-bold flex justify-center items-center hover:bg-orange-200 transition-colors shadow-sm"
                              >
                                Create Menu
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}