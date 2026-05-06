import React, { useState, useEffect, useMemo } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Calendar, CheckCircle, Save, Send, AlertTriangle,
  Search, Info, Utensils, Loader2, LayoutDashboard,
  List, LogOut, Globe, Plus, Package, Users, Lock, ChevronLeft, X, Clock
, User } from 'lucide-react';
import api, { getFullUrl } from '../../services/api';

const formatDateStr = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DailyMenuCreator() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState('vi');

  const [dishes, setDishes] = useState([]);
  const [isLoadingDishes, setIsLoadingDishes] = useState(true);

  const [menuDate, setMenuDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [rejectReason, setRejectReason] = useState('');

  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allergyWarnings, setAllergyWarnings] = useState([]);
  const [mealCounts, setMealCounts] = useState({ Standard: 0, Vegetarian: 0, None: 0 });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const minDate = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToNextMonday = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + diffToNextMonday);
    return formatDateStr(nextMonday);
  }, []);

  const [menuSlots, setMenuSlots] = useState({
    std_main: null, std_veg: null, std_soup: null, std_side: null, 
    veg_main: null, veg_veg: null, veg_soup: null, veg_side: null  
  });

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const res = await api.get('/kitchen/dishes');
        if (res.data && res.data.data) setDishes(res.data.data);
      } catch (error) {
        console.error("Lỗi tải món ăn:", error);
      } finally {
        setIsLoadingDishes(false);
      }
    };
    fetchDishes();

    const queryParams = new URLSearchParams(location.search);
    const dateParam = queryParams.get('date');

    if (dateParam) {
      setMenuDate(dateParam);
    } else {

      setMenuDate(minDate);
    }
  }, [minDate, location.search]);

  /**
 * Checks the status of the menu when the selected date changes.
 */
  useEffect(() => {
    const fetchMenuStatus = async () => {
      if (!menuDate || dishes.length === 0) return;
      try {
        const res = await api.get(`/menus/date/${menuDate}`);
        if (res.data && res.data.data) {
          const fetchedMenu = res.data.data;
          setStatus(fetchedMenu.Status);
          if (fetchedMenu.Status === 'Rejected') {
            setRejectReason(fetchedMenu.RejectReason || 'Thực đơn cần điều chỉnh lại định lượng dinh dưỡng.');
          }

          const stdIds = (fetchedMenu.StandardDishList || '').split(',').filter(Boolean);
          const vegIds = (fetchedMenu.VegetarianDishList || '').split(',').filter(Boolean);

          const findDish = (id) => dishes.find(d => d.DishID === parseInt(id) || d.id === parseInt(id));

          setMenuSlots({
            std_main: findDish(stdIds[0]) || null,
            std_veg: findDish(stdIds[1]) || null,
            std_soup: findDish(stdIds[2]) || null,
            std_side: findDish(stdIds[3]) || null,
            veg_main: findDish(vegIds[0]) || null,
            veg_veg: findDish(vegIds[1]) || null,
            veg_soup: findDish(vegIds[2]) || null,
            veg_side: findDish(vegIds[3]) || null
          });
        } else {

          setStatus('Draft');
          setRejectReason('');
          setMenuSlots({
            std_main: null, std_veg: null, std_soup: null, std_side: null,
            veg_main: null, veg_veg: null, veg_soup: null, veg_side: null
          });
        }
      } catch (error) {
        console.error("Lỗi kiểm tra ngày:", error);
      }
    };
    fetchMenuStatus();

    // Kiểm tra nếu là cuối tuần thì cảnh báo và chuyển về minDate
    const selectedDate = new Date(menuDate);
    const day = selectedDate.getDay();
    if (day === 0 || day === 6) {
      alert("Hệ thống không hỗ trợ lên thực đơn cho Thứ 7 và Chủ Nhật.");
      setMenuDate(minDate);
      return;
    }

    const fetchMealCounts = async () => {
      const isViewMode = new URLSearchParams(location.search).has('view');
      if (isViewMode && menuDate) {
        try {
          const res = await api.get(`/kitchen/meal-counts/${menuDate}`);
          if (res.data && res.data.data) {
            setMealCounts(res.data.data);
          }
        } catch (error) {
          console.error("Lỗi tải số lượng suất ăn:", error);
        }
      } else {
        setMealCounts({ Standard: 0, Vegetarian: 0, None: 0 });
      }
    };
    fetchMealCounts();
  }, [menuDate, dishes, location.search]);

  const { stdCalories, vegCalories, validation } = useMemo(() => {
    let stdCals = 0;
    let vegCals = 0;
    const missing = [];
    let allSuppliers = true;

    const requiredSlots = [
      'std_main', 'std_veg', 'std_soup', 'std_side',
      'veg_main', 'veg_veg', 'veg_soup', 'veg_side'
    ];

    requiredSlots.forEach(slotKey => {
      const dish = menuSlots[slotKey];
      if (!dish) {
        missing.push(slotKey);
        allSuppliers = false;
      } else {
        if (slotKey.startsWith('std_')) stdCals += Number(dish.calories) || 0;
        else if (slotKey.startsWith('veg_')) vegCals += Number(dish.calories) || 0;
        if (!dish.supplier) allSuppliers = false;
      }
    });

    return {
      stdCalories: stdCals,
      vegCalories: vegCals,
      validation: {
        isComplete: missing.length === 0,
        hasSuppliers: allSuppliers,
        missingCount: missing.length
      }
    };
  }, [menuSlots]);

  const isCurrentOrPastWeek = menuDate < minDate;
  const isReadOnly = status === 'Submitted' || status === 'Approved' || isCurrentOrPastWeek;
  const canSubmit = validation.isComplete && validation.hasSuppliers && !isReadOnly;

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const handleDishSelect = (slotKey, dishId) => {
    setAllergyWarnings([]);
    if (!dishId) {
      setMenuSlots(prev => ({ ...prev, [slotKey]: null }));
      return;
    }
    const selectedDish = dishes.find(d => d.id.toString() === dishId.toString());
    setMenuSlots(prev => ({ ...prev, [slotKey]: { ...selectedDish } }));
  };

  const handleOverride = (slotKey, field, value) => {
    setMenuSlots(prev => ({ ...prev, [slotKey]: { ...prev[slotKey], [field]: value } }));
  };

  const handleCheckAllergy = async () => {
    if (!menuDate) return alert("Vui lòng chọn ngày!");
    setIsChecking(true);
    try {
      const standardDishIds = [menuSlots.std_main?.id, menuSlots.std_veg?.id, menuSlots.std_soup?.id, menuSlots.std_side?.id].filter(Boolean);
      const vegetarianDishIds = [menuSlots.veg_main?.id, menuSlots.veg_veg?.id, menuSlots.veg_soup?.id, menuSlots.veg_side?.id].filter(Boolean);

      const res = await api.post('/menus/allergy-check', {
        date: menuDate, standardDishIds, vegetarianDishIds
      });
      setAllergyWarnings(res.data.warnings || []);
      if (res.data.status === 'SAFE') alert("Thực đơn an toàn.");
    } catch (error) {
      alert("Lỗi rà soát dị ứng.");
    } finally { setIsChecking(false); }
  };

  const handleSaveMenu = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      const standardDishIds = [menuSlots.std_main?.id, menuSlots.std_veg?.id, menuSlots.std_soup?.id, menuSlots.std_side?.id].filter(Boolean);
      const vegetarianDishIds = [menuSlots.veg_main?.id, menuSlots.veg_veg?.id, menuSlots.veg_soup?.id, menuSlots.veg_side?.id].filter(Boolean);

      await api.post('/menus', { MenuDate: menuDate, standardDishIds, vegetarianDishIds });
      setStatus('Submitted');
      showToast("Đã gửi thực đơn chờ duyệt!");
    } catch (error) {
      showToast(error.response?.data?.message || "Lỗi lưu thực đơn.", "error");
    } finally { setIsSaving(false); }
  };

  const DishBlock = ({ title, slotKey, filterType, colorObj }) => {
    const currentDish = menuSlots[slotKey];
    const availableDishes = Array.isArray(filterType) ? dishes.filter(d => filterType.includes(d.type)) : dishes.filter(d => d.type === filterType);

    if (isReadOnly) {
      return (
        <div className="flex flex-col bg-gray-50 rounded border border-gray-200 p-4 shadow-sm h-full opacity-90">
          <div className="flex justify-between items-center mb-3">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${colorObj.text}`}>
              <Utensils size={14} className={colorObj.icon} /> {title}
            </h3>
            <Lock size={14} className="text-gray-400" />
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 flex flex-col justify-center">
            {currentDish ? (
              <>
                <p className="font-black text-gray-900 text-base">{currentDish.name}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded">{currentDish.calories} kcal</span>
                  <span className="text-xs font-medium text-gray-500 truncate">NCC: {currentDish.supplier}</span>
                </div>
              </>
            ) : (
              <p className="text-gray-400 italic text-sm text-center">Đang chờ cập nhật dữ liệu món</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col bg-white rounded border-2 p-4 shadow-sm h-full transition-all ${!currentDish ? 'border-dashed border-gray-300 bg-gray-50/30' :
        (!currentDish.supplier || !currentDish.calories) ? 'border-yellow-300' : 'border-white'
        }`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${colorObj.text}`}>
            <Utensils size={14} className={colorObj.icon} /> {title}
          </h3>

        </div>
        <select
          value={currentDish?.id || ''}
          onChange={(e) => handleDishSelect(slotKey, e.target.value)}
          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
        >
          <option value="">-- Chọn {title} --</option>
          {availableDishes.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {currentDish && (
          <div className="mt-2 text-[11px] space-y-1">
            <p className="font-bold text-gray-700">Calo: <span className="text-orange-600">{currentDish.calories} kcal</span></p>
            <p className="text-gray-500 truncate">NCC: {currentDish.supplier}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col  text-gray-800 pb-10">

      {/* 1. NAVBAR */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Utensils size={20} /></div>
            <span className="font-bold text-lg text-gray-900 hidden sm:block">Quản lý bếp ăn</span>
          </div>
          <div className="hidden lg:flex space-x-6 text-sm font-semibold text-gray-500 h-full">
            <Link to="/kitchen/dashboard" className="hover:text-orange-600 h-full flex items-center transition-colors"><LayoutDashboard size={16} className="mr-1.5" /> Tổng quan</Link>
            <span className="text-orange-600 border-b-2 border-orange-500 h-full flex items-center cursor-default"><Plus size={16} className="mr-1.5" /> Tạo thực đơn ngày</span>
            <span onClick={() => navigate('/kitchen/weekly-menu')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              <Calendar size={16} className="mr-1.5" /> {lang === 'vi' ? 'Thực đơn tuần' : 'Weekly menu'}
            </span>            <Link to="/kitchen/dishes" className="hover:text-orange-600 h-full flex items-center transition-colors"><List size={16} className="mr-1.5" /> Món ăn</Link>
            <span onClick={() => navigate('/kitchen/ingredients')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              <Package size={16} className="mr-1.5" /> {lang === 'vi' ? 'Nguyên liệu' : 'Ingredients'}
            </span>          </div>
          <div className="flex items-center space-x-3 text-gray-400">

            <button onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} className="flex items-center space-x-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200 hover:bg-gray-200 transition-colors shadow-sm">
              <span>{lang === 'vi' ? 'VN' : 'EN'}</span>
            </button>
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
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded transition-colors font-bold mt-1">{lang === 'vi' ? 'Đăng xuất' : 'Logout'}</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* 2. TOOLBAR & STATUS STEPPER */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lên thực đơn ngày</h1>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
            {/* Calendar */}
            <div className={`flex items-center border rounded px-4 py-2 transition-colors cursor-pointer shadow-inner ${isCurrentOrPastWeek ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200 hover:border-orange-300'}`}>
              <Calendar size={18} className={isCurrentOrPastWeek ? 'text-gray-400 mr-2' : 'text-orange-500 mr-2'} />
              <input
                type="date"
                value={menuDate}
                min={minDate}
                onChange={(e) => { setMenuDate(e.target.value); setAllergyWarnings([]); }}
                className="bg-transparent font-bold text-gray-800 outline-none w-full cursor-pointer disabled:text-gray-400"
              />
              {isCurrentOrPastWeek && <Lock size={14} className="text-gray-400 ml-2" />}
            </div>
          </div>

          {/* Status Stepper */}
          <div className="flex items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2 sm:gap-3 bg-gray-50/80 p-2 rounded-md border border-gray-100">

              {/* Step 1 */}
              <div className={`px-4 py-2 rounded text-sm font-bold flex items-center transition-all shadow-sm ${status === 'Draft' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white text-green-600 border border-green-200'
                }`}>
                1. Lên thực đơn ngày
              </div>

              <div className={`w-6 sm:w-10 h-[2px] rounded-full ${status === 'Draft' ? 'bg-gray-200' : 'bg-green-400'}`}></div>

              {/* Step 2 */}
              <div className={`px-4 py-2 rounded text-sm font-bold flex items-center transition-all shadow-sm ${status === 'Submitted' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                (status === 'Approved' ? 'bg-white text-green-600 border border-green-200' : 'bg-white text-gray-400 border border-gray-200')
                }`}>
                2. Chờ Admin duyệt
              </div>

              <div className={`w-6 sm:w-10 h-[2px] rounded-full ${status === 'Approved' ? 'bg-green-400' : 'bg-gray-200'}`}></div>

              {/* Step 3 */}
              <div className={`px-4 py-2 rounded text-sm font-bold flex items-center transition-all shadow-sm ${status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                (status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white text-gray-400 border border-gray-200')
                }`}>
                3. {status === 'Rejected' ? 'Bị từ chối' : 'Hoàn tất'}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 2.5 HIỂN THỊ SỐ LƯỢNG SUẤT ĂN (Chỉ hiện khi bấm xem từ menu tuần - CÓ THỰC ĐƠN) */}
      {new URLSearchParams(location.search).has('view') && (
        <div className="max-w-[1400px] mx-auto px-6 mt-4">
          <div className="bg-white border border-indigo-100 rounded-lg p-4 shadow-sm flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">Tổng đăng ký:</span>
              <span className="text-indigo-700 font-black text-lg">{mealCounts.Standard + mealCounts.Vegetarian}</span>
            </div>
            <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-sm font-bold text-gray-600">Suất Mặn:</span>
              <span className="font-black text-orange-600">{mealCounts.Standard}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-sm font-bold text-gray-600">Suất Chay:</span>
              <span className="font-black text-green-600">{mealCounts.Vegetarian}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              <span className="text-sm font-bold text-gray-600">Không ăn:</span>
              <span className="font-black text-gray-500">{mealCounts.None}</span>
            </div>
            <div className="ml-auto bg-indigo-50 px-3 py-1 rounded text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Dữ liệu thời gian thực
            </div>
          </div>
        </div>
      )}

      {status === 'Rejected' && (
        <div className="max-w-[1400px] mx-auto px-6 mt-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">

            <div><h3 className="font-bold text-red-800">Bị từ chối:</h3><p className="text-red-700 text-sm">{rejectReason}</p></div>
          </div>
        </div>
      )}

      {/* 2.5 DISPLAY MEAL COUNTS (Only when viewed from weekly menu) */}
      {new URLSearchParams(location.search).has('view') && (
        <div className="px-4 sm:px-6 mt-4">
          <div className="bg-white border border-indigo-100 rounded-lg p-4 shadow-sm flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">Tổng đăng ký:</span>
              <span className="text-indigo-700 font-black text-lg">{mealCounts.Standard + mealCounts.Vegetarian}</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Suất Mặn:</span>
              <span className="text-orange-600 font-bold">{mealCounts.Standard}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Suất Chay:</span>
              <span className="text-green-600 font-bold">{mealCounts.Vegetarian}</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Không ăn:</span>
              <span className="text-gray-600 font-bold">{mealCounts.None}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 px-4 sm:px-6 py-6 flex flex-col xl:flex-row gap-6 max-w-[1400px] mx-auto w-full">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* STANDARD COLUMN */}
          <div className="bg-orange-50/40 border border-orange-100 p-5 rounded-md flex flex-col gap-4">
            <h2 className="text-lg font-black text-orange-800 flex items-center border-b border-orange-200/60 pb-3 uppercase">Suất tiêu chuẩn (mặn)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DishBlock title="Món Chính" slotKey="std_main" filterType="Mặn" colorObj={{ text: 'text-orange-900', icon: 'text-orange-500' }} />
              <DishBlock title="Món Rau" slotKey="std_veg" filterType="Rau" colorObj={{ text: 'text-green-900', icon: 'text-green-500' }} />
              <DishBlock title="Món Canh" slotKey="std_soup" filterType="Canh" colorObj={{ text: 'text-blue-900', icon: 'text-blue-500' }} />
              <DishBlock title="Tráng Miệng" slotKey="std_side" filterType="Phụ" colorObj={{ text: 'text-purple-900', icon: 'text-purple-500' }} />
            </div>
          </div>
          {/* VEGETARIAN COLUMN */}
          <div className="bg-green-50/40 border border-green-100 p-5 rounded-md flex flex-col gap-4">
            <h2 className="text-lg font-black text-green-800 flex items-center border-b border-green-200/60 pb-3 uppercase">Suất chay</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DishBlock title="Món Chính" slotKey="veg_main" filterType="Chay" colorObj={{ text: 'text-green-900', icon: 'text-green-500' }} />
              <DishBlock title="Rau Củ" slotKey="veg_veg" filterType="Rau" colorObj={{ text: 'text-emerald-900', icon: 'text-emerald-500' }} />
              <DishBlock title="Canh Chay" slotKey="veg_soup" filterType="Canh" colorObj={{ text: 'text-teal-900', icon: 'text-teal-500' }} />
              <DishBlock title="Tráng Miệng" slotKey="veg_side" filterType="Phụ" colorObj={{ text: 'text-purple-900', icon: 'text-purple-500' }} />
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full xl:w-[360px] flex flex-col gap-5">
          <div className="bg-[#fff9e6] border border-[#fce49c] rounded-md p-5 shadow-sm">
            <h2 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-3">Dinh dưỡng (kcal)</h2>
            <div className="space-y-3">
              <div className="flex justify-between font-bold"><span>Suất Mặn:</span><span className="text-orange-600">{stdCalories}</span></div>
              <div className="flex justify-between font-bold"><span>Suất Chay:</span><span className="text-green-600">{vegCalories}</span></div>
            </div>
          </div>
          {allergyWarnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-60 overflow-y-auto">
              <h2 className="text-xs font-bold text-red-800 uppercase mb-2">Cảnh báo dị ứng ({allergyWarnings.length})</h2>
              {allergyWarnings.map((w, idx) => (
                <div key={idx} className="text-[11px] mb-2 p-2 bg-white rounded border border-red-100">
                  <p><b>{w.studentName}</b> ({w.className}) - {w.mealType}</p>
                  <p className="text-red-600">Trùng: {w.conflictAllergens.join(', ')}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-3 mt-auto">
            {!isReadOnly && (
              <>
                <button onClick={handleCheckAllergy} disabled={!canSubmit || isChecking} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded hover:bg-gray-800 flex justify-center items-center gap-2">
                  {isChecking ? <Loader2 className="animate-spin" /> : <Search size={18} />} Rà soát dị ứng
                </button>
                <button onClick={handleSaveMenu} disabled={!canSubmit || isSaving} className={`w-full font-bold py-3.5 rounded flex justify-center items-center gap-2 ${canSubmit ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {isSaving ? <Loader2 className="animate-spin" /> : <Send size={18} />} Chốt thực đơn
                </button>
              </>
            )}
            {isReadOnly && (
              <div className="w-full bg-blue-50 text-blue-700 font-bold py-4 rounded text-center border border-blue-200">Khóa (Chờ duyệt)</div>
            )}
          </div>
        </div>
      </main>
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[9999] px-6 py-3.5 rounded-md shadow-sm border flex items-center gap-3 transition-all duration-300 transform translate-x-0 ${toast.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-red-50 border-red-200 text-red-700'
          }`}>
          <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span className="font-bold text-sm pr-4">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: '' })} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}