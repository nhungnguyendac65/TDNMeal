import React, { useState, useEffect } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import {
  Users, Utensils, AlertTriangle, Carrot,
  Beef, Calendar, Package, AlertCircle, Plus, List,
  LogOut, Globe, LayoutDashboard
, User } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import api from '../../services/api';

const pieColors = ['#fdba74', '#86efac', '#93c5fd', '#f9a8d4']; 

// ==========================================
// COMPONENT: SUMMARY CARD
// ==========================================
const SummaryCard = ({ title, value, subtitle, colorTheme, icon: Icon, bgIcon: BgIcon, isAlert }) => {
  const themes = {
    blue: { bg: 'bg-blue-100 text-blue-600', text: 'text-blue-800', border: 'border-blue-100' },
    orange: { bg: 'bg-orange-100 text-orange-600', text: 'text-orange-800', border: 'border-orange-100' },
    green: { bg: 'bg-green-100 text-green-600', text: 'text-green-800', border: 'border-green-100' },
    pink: { bg: 'bg-pink-100 text-pink-600', text: 'text-pink-800', border: 'border-pink-200' },
  };

  const theme = themes[colorTheme];
  const alertActive = isAlert && value > 0;

  return (
    <div className={`bg-white rounded-md p-6 shadow-sm border ${theme.border} relative overflow-hidden group ${alertActive ? 'bg-pink-50/30' : ''}`}>

      {/* BACKGROUND ICON SCALE EFFECT ON HOVER */}
      <div className={`absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-300 ${alertActive ? 'text-pink-600' : 'text-gray-900'}`}>
        <BgIcon size={100} />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.text}`}>
          {title}
        </h3>
        <div className={`p-2 rounded-lg ${theme.bg}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="relative z-10">
        <p className={`text-4xl font-black ${alertActive ? 'text-pink-600' : 'text-gray-900'}`}>
          {value}
        </p>
        <p className={`text-xs font-medium mt-2 ${alertActive ? 'text-pink-600 animate-pulse' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default function KitchenDashboard() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en'); // Default to English

  // BACKEND DATA STATE
  const [dashboardData, setDashboardData] = useState({
    targetDate: '',
    summary: { totalMeals: 0, standardMeals: 0, vegetarianMeals: 0, totalAllergies: 0 },
    allergyList: [],
    menuStatus: '',
    dishes: [],
    ingredientWarnings: [],
    barData: [],
    pieData: [],
    nutritionData: [],
    dishCategoryData: [],
    inventoryStockData: []
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchKitchenData = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return navigate('/login');
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      if (user.Role !== 'Kitchen' && user.role !== 'Kitchen') {
        alert("Access Denied!");
        localStorage.clear();
        return navigate('/login');
      }

      try {
        const res = await api.get('/kitchen/dashboard');
        if (res.data && res.data.data) {
          setDashboardData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching Kitchen data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKitchenData();

    const handleUserUpdate = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setCurrentUser(JSON.parse(storedUser));
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, [navigate, lang]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-medium text-gray-500">
      Loading operational data...
    </div>;
  }

  // Display Date Logic
  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const displayDate = dashboardData.targetDate
    ? new Date(dashboardData.targetDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
    : today.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  const total = dashboardData.summary.totalMeals || 1;

  return (
    <div className="min-h-screen bg-[#f9fafb]  text-gray-800 pb-12">

      {/* 1. NAVBAR */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Utensils size={20} /></div>
            <span className="font-bold text-lg text-gray-900 hidden sm:block">Quản lý bếp ăn</span>
          </div>
          <div className="hidden lg:flex space-x-6 text-sm font-semibold text-gray-500 h-full">
            <span className="text-orange-600 border-b-2 border-orange-500 h-full flex items-center cursor-pointer transition-colors">
              Overview
            </span>
            <span onClick={() => navigate('/kitchen/create-menu')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              <Plus size={16} className="mr-1.5" /> {lang === 'vi' ? 'Tạo thực đơn ngày' : 'Create daily menu'}
            </span>
            <span onClick={() => navigate('/kitchen/weekly-menu')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              Weekly Menu
            </span>
            <span onClick={() => navigate('/kitchen/dishes')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              Dishes
            </span>
            <span onClick={() => navigate('/kitchen/ingredients')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              Ingredients
            </span>
          </div>
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

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Monitor today's meals, allergy alerts, and kitchen preparation status.</p>
          </div>
          <div className="bg-white px-4 py-2.5 rounded border border-gray-200 shadow-sm text-sm font-semibold text-gray-600 flex items-center gap-2">
            <Calendar size={16} className="text-orange-600" />
            {displayDate}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard title="Total Meals" value={dashboardData.summary.totalMeals} subtitle="Total registered for today" colorTheme="blue" icon={Users} bgIcon={Utensils} />
          <SummaryCard title="Standard Meals" value={dashboardData.summary.standardMeals} subtitle={`Accounts for ${Math.round((dashboardData.summary.standardMeals / total) * 100)}%`} colorTheme="orange" icon={Beef} bgIcon={Beef} />
          <SummaryCard title="Vegetarian Meals" value={dashboardData.summary.vegetarianMeals} subtitle={`Accounts for ${Math.round((dashboardData.summary.vegetarianMeals / total) * 100)}%`} colorTheme="green" icon={Carrot} bgIcon={Carrot} />
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-md p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">Meal Trends (This Week)</h3>
            <div className="h-64">
              {dashboardData.barData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <Tooltip cursor={{ fill: '#fff7ed' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="meals" fill="#fdba74" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">No data</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Meal Distribution</h3>
            <div className="flex-1 min-h-[200px] flex items-center justify-center">
              {dashboardData.pieData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboardData.pieData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                      {dashboardData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-gray-400">No data</div>
              )}
            </div>
            {dashboardData.pieData?.length > 0 && (
              <div className="flex justify-center space-x-6 mt-4">
                {dashboardData.pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center text-xs font-medium text-gray-600">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: pieColors[i % pieColors.length] }}></span>
                    {entry.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* INVENTORY STATUS (NEW) */}
        <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100">
           <h3 className="text-sm font-semibold text-gray-900 mb-6">Stock Levels (Lowest Items)</h3>
           <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {dashboardData.inventoryStockData.map((item, idx) => {
                const ratio = Math.min((item.quantity / item.min) * 100, 100);
                const isLow = item.quantity <= item.min;
                return (
                  <div key={idx} className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                          <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" 
                                  strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * ratio) / 100}
                                  className={isLow ? 'text-red-500' : 'text-blue-500'} />
                       </svg>
                       <span className={`absolute text-xs font-bold ${isLow ? 'text-red-600' : 'text-blue-600'}`}>{item.quantity}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-700 truncate w-full">{item.name}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Min: {item.min}</p>
                  </div>
                )
              })}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                <h2 className="text-lg font-bold text-gray-900">Today's Menu Details</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${dashboardData.menuStatus === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                  {dashboardData.menuStatus}
                </span>
              </div>
              <div className="space-y-3">
                {dashboardData.dishes.length > 0 ? (
                  <ul className="space-y-2">
                    {dashboardData.dishes.map((dish, index) => (
                      <li key={index} className="flex justify-between items-center text-sm p-3 bg-white border border-gray-100 rounded hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-gray-800">{index + 1}. {dish.name}</span>
                        <span className="text-gray-500 font-medium">{dish.calories} kcal</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-gray-400 italic text-sm">No menu for today</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-50 pb-4">Inventory & Ingredients</h2>
              <ul className="space-y-3">
                {dashboardData.ingredientWarnings.length > 0 ? (
                  dashboardData.ingredientWarnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded">
                      <div className="mt-0.5 text-red-500"><AlertTriangle size={16} /></div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{warning.name}</p>
                        <p className="text-xs text-red-600 mt-0.5 font-medium">{warning.issue}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-center py-4 text-sm text-gray-500 font-medium">Inventory okay</li>
                )}
              </ul>
              <button onClick={() => navigate('/kitchen/ingredients')} className="w-full mt-4 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded border border-gray-200 hover:bg-100 transition-colors">
                Manage Inventory
              </button>
            </div>
          </div>
        </div>
      </main>
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}