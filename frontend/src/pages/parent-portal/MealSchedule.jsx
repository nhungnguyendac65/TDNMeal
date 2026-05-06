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

          // [OPTIMIZED]: Single API call to fetch entire week context
          const startStr = weekDays[0].toISOString().split('T')[0];
          const response = await api.get(`/schedule/weekly-context?studentId=${activeStudent}&startDate=${startStr}`);

          const { statuses, selections: dbSelections, menus } = response.data.data;

          setMonthStatuses(statuses);
          setSelections(dbSelections);
          setWeeklyMenu(menus);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error loading schedule data:", err);
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
      alert("Network error while saving choice. Please try again!");
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
      'Main Dish': 'bg-red-50 text-red-700 border-red-200',
      'Vegetable': 'bg-green-50 text-green-700 border-green-200',
      'Soup': 'bg-blue-50 text-blue-700 border-blue-200',
      'Side Dish': 'bg-purple-50 text-purple-700 border-purple-200',
    };
    const translatedType = type === 'Món mặn' ? 'Main Dish' : type === 'Món rau' ? 'Vegetable' : type === 'Món canh' ? 'Soup' : type === 'Món phụ' ? 'Side Dish' : type;
    return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[translatedType] || 'bg-gray-100 text-gray-600'}`}>{translatedType}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12  text-gray-800 relative">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-gray-900 hidden sm:block">TDN Meal Portal</span>
          </div>

          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-500">
            <span onClick={() => navigate('/parent/dashboard')} className="hover:text-gray-900 py-5 cursor-pointer transition-colors">Overview</span>
            <span className="text-green-600 border-b-2 border-green-500 py-5 cursor-pointer">Menu</span>
            <span onClick={() => navigate('/registrations')} className="hover:text-gray-900 py-5 cursor-pointer transition-colors">Payment</span>
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
                  <p className="text-[13px] font-bold text-slate-800">Account</p>
                </div>
                <div className="p-1.5">
                  <button onClick={() => navigate('/onboarding', { state: { allowUpdate: true } })} className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors font-semibold">Edit Child Profile</button>
                  <button onClick={() => setIsProfileModalOpen(true)} className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors font-semibold">Change Password</button>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded transition-colors font-bold mt-1">Logout</button>
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
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronLeft size={20} /></button>
            <div className="font-bold text-green-700 bg-green-50 px-4 py-2 rounded border border-green-100 flex items-center">
              <Calendar size={18} className="mr-2" />
              Week {weekDays[0]?.getDate()}/{weekDays[0]?.getMonth() + 1} - {weekDays[4]?.getDate()}/{weekDays[4]?.getMonth() + 1}
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronRight size={20} /></button>
          </div>
        </div>

        {currentStudentData?.hasAllergy && (
          <div className="bg-pink-50 border border-pink-200 rounded p-4 mb-6 flex items-start space-x-3 shadow-sm">
            <Shield className="text-pink-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-bold text-pink-800">Allergy Note: {currentStudentData?.allergyNote}</h4>
              <p className="text-sm text-pink-700 mt-1">The system automatically warns of dishes containing the above ingredients. The kitchen has also recorded this information.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-gray-500 font-medium animate-pulse">Loading menu data from system...</div>
        ) : (
          <div className="space-y-6">
            {weekDays.map((date) => {
              const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const dayMonth = dateString.substring(0, 7);
              const isDayPaid = monthStatuses[dayMonth];
              const isLocked = checkIsLocked(date);

              const currentChoice = selections[dateString];

              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayIndex = date.getDay();

            // [SYNC]: Fetch real menu from database for the specific date (dateString)
            const menuData = weeklyMenu[dateString] || {totalCalories: 0, standardDishes: [], vegetarianDishes: [] };

            const rawActiveDishes = currentChoice === 'Vegetarian' ? menuData.vegetarianDishes :
            currentChoice === 'None' ? [] : menuData.standardDishes;
            const activeDishes = Array.isArray(rawActiveDishes) ? rawActiveDishes : [];

            const isHoliday = (date.getDate() === 30 && date.getMonth() === 3) || (date.getDate() === 1 && date.getMonth() === 4);

              if (isHoliday) {
                return (
                  <div key={dateString} className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden opacity-70">
                    <div className="px-5 py-3 bg-gray-100 font-bold text-gray-500">{dayNames[dayIndex]} - {date.toLocaleDateString('en-US')}</div>
                    <div className="p-8 text-center text-gray-500 font-medium">🌴 Holiday - No meals served</div>
                  </div>
                );
              }

              return (
                <div key={dateString} className={`bg-white rounded-md border ${!isDayPaid ? 'border-orange-200' : isLocked ? 'border-gray-200 opacity-90' : 'border-green-200 shadow-md'} overflow-hidden transition-all flex flex-col md:flex-row relative`}>
                  
                  {!isDayPaid && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6 text-center">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                        <Lock size={24} />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">Menu Locked</h4>
                      <p className="text-sm text-gray-600 mb-4">Please pay for month {dayMonth.split('-')[1]} to view the menu and select dishes.</p>
                      <button onClick={() => navigate('/registrations')} className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-sm">
                        Pay Now
                      </button>
                    </div>
                  )}

                  <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 p-5 relative">

                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                  <div>
                    <span className={`font-bold text-lg ${!isDayPaid ? 'text-orange-800' : isLocked ? 'text-gray-600' : 'text-green-800'}`}>
                      {dayNames[dayIndex]}
                      {currentChoice === 'Vegetarian' && <span className="text-yellow-600 text-sm ml-2">(Vegetarian)</span>}
                      {currentChoice === 'None' && <span className="text-red-600 text-sm ml-2">(No meal)</span>}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">{date.toLocaleDateString('en-US')}</span>
                  </div>
                  <div className="flex items-center text-orange-500 bg-orange-50 px-3 py-1 rounded-full text-sm font-bold border border-orange-100">
                    <Flame size={16} className="mr-1" /> {menuData.totalCalories || 0} kcal
                  </div>
                </div>

                <div className="space-y-3 animate-in fade-in duration-300" key={currentChoice}>
                  {currentChoice === 'None' ? (
                    <div className="text-center py-6 text-gray-500 italic text-sm font-medium border border-dashed border-gray-300 rounded bg-gray-50">
                      You have chosen not to have a school meal on this day.
                    </div>
                  ) : activeDishes.length > 0 ? (
                    activeDishes.map((dish) => {
                      const hasAllergyWarning = checkAllergyWarning(dish.allergens);

                      return (
                        <div key={dish.id}
                          onClick={() => {
                            if (isDayPaid) setSelectedDish(dish);
                          }}
                          className={`flex items-start justify-between p-3 rounded border cursor-pointer transition-all active:scale-95
                                ${hasAllergyWarning ? 'bg-pink-50 border-pink-200 hover:border-pink-400 hover:shadow-md' : 'bg-gray-50 border-gray-100 hover:border-green-400 hover:shadow-md'}`}
                        >
                          <div className="flex-1 flex space-x-3">
                            {dish.imageUrl && (
                              <img
                                src={dish.imageUrl}
                                alt={dish.name}
                                className="w-16 h-16 rounded-md object-cover border border-gray-200 flex-shrink-0"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                {renderDishTypeBadge(dish.type)}
                                <h4 className={`font-bold text-sm ${hasAllergyWarning ? 'text-pink-900' : 'text-gray-800'}`}>{dish.name}</h4>
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <Flame size={12} className="mr-1 text-gray-400" /> {dish.calories} kcal
                              </div>
                              {hasAllergyWarning && Array.isArray(dish.allergens) && (
                                <p className="text-[11px] text-pink-600 font-medium mt-1.5 flex items-center">
                                  Contains: {dish.allergens.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-center justify-center bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 shadow-sm ml-3 transition-colors hover:bg-blue-50 h-full mt-auto mb-auto">
                            <Search size={16} className="mb-1" /> View
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-400 italic text-sm">Kitchen is updating the menu for this day...</div>
                  )}
                </div>
              </div>

              <div className={`w-full md:w-64 p-5 flex flex-col justify-center ${!isDayPaid ? 'bg-orange-50/30' : 'bg-gray-50/50'} relative`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-gray-700 text-sm uppercase tracking-wider">Your choice</span>
                  {isLocked ? (
                    <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded border"><Clock size={10} className="inline mr-1" /> FINALIZED</span>
                  ) : (
                    <span className="text-[10px] font-bold text-orange-600 bg-white px-2 py-1 rounded border border-orange-200 shadow-sm"><Clock size={10} className="inline mr-1" /> 8:00 PM PREV DAY</span>
                  )}
                </div>

                {!currentChoice && !isLocked && isDayPaid && (
                  <div className="mb-3 text-xs text-blue-700 font-medium text-center bg-blue-100 p-2 rounded-lg border border-blue-200">
                    System Default: Standard Meal
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
                    <span className="font-bold">Standard meal</span>
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
                    <span className="font-bold">Vegetarian meal</span>
                  </button>

                  <button onClick={() => handleSelectMeal(dateString, 'None')} disabled={isLocked || !isDayPaid}
                    className={`relative p-3 rounded border-2 text-left transition-all flex items-center
                          ${currentChoice === 'None' ? 'border-red-500 bg-red-50 text-red-900 shadow-sm' : 'border-gray-200 bg-white hover:border-red-300 text-gray-600'}
                          ${(isLocked || !isDayPaid) && currentChoice !== 'None' ? 'opacity-40' : ''}
                        `}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${currentChoice === 'None' ? 'border-red-600' : 'border-gray-300'}`}>
                      {currentChoice === 'None' && <div className="w-2 h-2 bg-red-600 rounded-full"></div>}
                    </div>
                    <span className="font-bold">No meal</span>
                  </button>
                </div>

                {saveStatus[dateString] === 'success' && (
                  <div className="mt-4 text-center text-sm font-bold text-green-700 bg-green-100 p-2 rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-2">
                    Saved {currentChoice === 'Standard' ? 'Standard' : currentChoice === 'Vegetarian' ? 'Vegetarian' : 'None'}!
                  </div>
                )}
              </div>
            </div>
            );
            })}
          </div>
        )}
      </main>

      {/* DISH DETAILS POPUP */}
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
                  <Utensils size={16} className="mr-2 text-green-600" /> Main Ingredients
                </h4>
                <p className="text-gray-700 bg-green-50 p-4 rounded border border-green-100 leading-relaxed text-sm font-medium">
                  {selectedDish.ingredients || 'Updating...'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider flex items-center">
                  <Building size={16} className="mr-2 text-blue-600" /> Supplier Information
                </h4>
                <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded border border-blue-100">
                  <img
                    src={selectedDish.supplierLogo || 'https://placehold.co/100x100/3B82F6/FFF?text=Supplier'}
                    alt="Supplier Logo"
                    className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover bg-white"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/100x100/9CA3AF/FFF?text=Supplier';
                    }}
                  />
                  <div>
                    <p className="font-bold text-blue-900 text-base">{selectedDish.supplier || 'Updating...'}</p>
                    <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-100 inline-block px-2 py-0.5 rounded">
                      VietGAP Standard Partner
                    </p>
                  </div>
                </div>
              </div>

              {Array.isArray(selectedDish.allergens) && selectedDish.allergens.length > 0 && (
                <div className="bg-pink-50 p-4 rounded border border-pink-200">
                  <h4 className="text-sm font-bold text-pink-900 mb-2 flex items-center">
                    <Shield size={16} className="mr-2" /> Allergenic Ingredients
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
                Close
              </button>
            </div>

          </div>
        </div>
      )}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}