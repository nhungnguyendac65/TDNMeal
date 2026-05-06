import ProfileModal from '../../components/ProfileModal';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, CheckCircle, CreditCard, Banknote, Loader2, Timer, UserCheck, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import api from '../../services/api';

/**
 * MealRegistration Component
 * Handles student meal registration for future months, supporting both 
 * Cash (via teacher) and Bank Transfer (via PayOS/VietQR) payment methods.
 */
export default function MealRegistration() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [monthOptions, setMonthOptions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const [timeLeft, setTimeLeft] = useState(900);

  /**
   * Generates a list of eligible months for registration (next 3 months).
   */
  useEffect(() => {
    const generateMonths = () => {
      const options = [];
      const d = new Date();
        options.push({ value, label: `Month ${nextD.getMonth() + 1}, ${nextD.getFullYear()}` });
      }
      setMonthOptions(options);
      if (options.length > 0) setSelectedMonth(options[0].value);
    };
    generateMonths();
  }, []);

  /**
   * Fetches students associated with the logged-in parent.
   */
  useEffect(() => {
    const fetchStudents = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return navigate('/login');
      try {
        const res = await api.get(`/students/parent/${user.UserID || user.id}`);
        setStudents(res.data.data);
        if (res.data.data.length > 0) setSelectedStudent(res.data.data[0].StudentID || res.data.data[0].id);
      } catch (err) { console.error(err); }
    };
    fetchStudents();
  }, [navigate]);

  /**
   * Retrieves registration context (locked status, price, current registration) 
   * for the selected student and month.
   */
  const fetchContext = async (signal) => {
    if (!selectedStudent || !selectedMonth) return;
    
    setShowPayment(false);
    setPaymentMethod('');
    setError('');
    setLoading(true);

    try {
      const res = await api.get(`/registrations/context?studentId=${selectedStudent}&month=${selectedMonth}`, { signal });
      setContext(res.data);
      if (res.data.registrationStatus === 'Pending Payment' && res.data.paymentMethod === 'Transfer') {
        setTimeLeft(res.data.remainingSeconds || 600);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('[FetchContext Error]', err);
      setError('Unable to load calculation data. Please try again.'); 
      setContext(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const controller = new AbortController();
    fetchContext(controller.signal); 
    return () => controller.abort();
  }, [selectedStudent, selectedMonth]);

  /**
   * Manages the 10-minute countdown timer for pending PayOS payments.
   * Triggers a context refresh upon expiration to handle automatic cancellation.
   */
  useEffect(() => {
    let timer;
    if (context?.registrationStatus === 'Pending Payment' && context?.paymentMethod === 'Transfer' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && context?.registrationStatus === 'Pending Payment') {
      fetchContext();
    }
    return () => clearInterval(timer);
  }, [context, timeLeft]);

  /**
   * Formats remaining seconds into MM:SS format.
   * @param {number} seconds - Total seconds to format.
   * @returns {string} Formatted time string.
   */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /**
   * Submits the meal registration request.
   * Redirects to PayOS checkout if the payment method is 'Transfer'.
   */
  const handleFinalSubmit = async () => {
    if (!paymentMethod) return setError('Please select a payment method.');
    setLoading(true);
    try {
      const res = await api.post('/registrations', { StudentID: selectedStudent, Month: selectedMonth, PaymentMethod: paymentMethod });

      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }

      await fetchContext();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12  text-gray-800">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-gray-900 hidden sm:block">TDN Meal Portal</span>
          </div>

          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-500">
            <span onClick={() => navigate('/parent/dashboard')} className="hover:text-gray-900 py-5 cursor-pointer transition-colors">Overview</span>
            <span onClick={() => navigate('/schedule')} className="hover:text-gray-900 py-5 cursor-pointer transition-colors">Menu</span>
            <span className="text-green-600 border-b-2 border-green-500 py-5 cursor-pointer">Payment</span>
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

      <main className="px-2 sm:px-4">
        <div className="max-w-[520px] mx-auto bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-200 relative">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-6 border-b border-gray-100 pb-4">Monthly Registration Form</h2>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Student</label>
            <select className="w-full h-[40px] rounded-[8px] border border-gray-300 px-3 bg-white" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} disabled={showPayment}>
              {students.map(s => <option key={s.id || s.StudentID} value={s.id || s.StudentID}>{s.FullName}</option>)}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Month</label>
            <select className="w-full h-[40px] rounded-[8px] border border-gray-300 px-3 bg-white" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} disabled={showPayment}>
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {loading ? <div className="text-center py-4 text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" /> Loading...</div> :
            context?.isLocked ? (
              <div className="bg-red-50 p-4 rounded border border-red-100 text-center"><p className="text-sm text-red-700">Registration for this month has expired.</p></div>
            ) : context?.isRegistered ? (

              context.registrationStatus !== 'Paid' ? (

                context.paymentMethod === 'Cash' ? (
                  <div className="bg-orange-50 p-6 rounded-md border border-orange-200 text-center animate-in fade-in">
                    <UserCheck className="mx-auto text-orange-500 mb-3" size={48} />
                    <h3 className="text-xl font-bold text-orange-800 mb-2">Awaiting Teacher Confirmation</h3>
                    <p className="text-sm text-orange-700 mb-4 border-b border-orange-200 pb-4">Form created. Please send cash to the Homeroom Teacher for system confirmation.</p>
                    <p className="text-xs text-orange-600 font-medium">Note: You cannot select dishes until registration is confirmed.</p>
                  </div>
                ) : (
                  <div className="text-center py-2 animate-in fade-in duration-300">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-6 shadow-sm text-center">
                      <CreditCard className="mx-auto text-blue-500 mb-3" size={48} />
                      <h3 className="text-xl font-bold text-blue-900 mb-2">Pending Payment</h3>
                      <p className="text-sm text-blue-700 mb-6">You have selected Bank Transfer via PayOS (VietQR).</p>

                      {context.checkoutUrl ? (
                        <>
                          <a href={context.checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all w-full mb-3">
                            Open PayOS Payment Page
                          </a>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                              <Timer size={16} className="text-red-500" />
                              <span className="text-sm">Expires in:</span>
                            </div>
                            <span className="text-base font-bold text-red-600">{formatTime(timeLeft)}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-red-500 text-xs italic">Payment link not found, please try again.</p>
                      )}
                    </div>
                  </div>
                )

              ) : (
                <div className="bg-green-50 p-8 rounded-md border border-green-200 text-center animate-in zoom-in">
                  <h3 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h3>
                  <p className="text-sm text-green-700 mb-8">Payment received. Please select your dishes in the weekly menu.</p>
                  <button onClick={() => navigate('/parent/schedule')} className="bg-green-600 hover:bg-green-700 text-white w-full py-3 rounded-[10px] font-bold shadow-md transition-all">
                    Go to Weekly Menu
                  </button>
                </div>
              )
            ) : (
              <>
                <div className="bg-yellow-50/50 p-4 rounded-xl mb-6 border border-yellow-100">
                  <h3 className="text-[12px] font-bold text-slate-500 mb-3 uppercase text-center tracking-widest">Payment Summary</h3>
                  <div className="space-y-2.5 text-sm text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total school days:</span><span className="font-bold text-slate-900">{context?.totalDays} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Meal price:</span><span className="font-bold text-slate-900">35,000 VND</span>
                    </div>
                    <div className="pt-3 mt-1 border-t border-yellow-200 flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-base">Total:</span>
                      <span className="font-extrabold text-xl text-green-600">{context?.totalPrice.toLocaleString('vi-VN')} VND</span>
                    </div>
                  </div>
                </div>

                {!showPayment ? (
                  <button onClick={() => setShowPayment(true)} className="bg-[#bbf7d0] hover:bg-[#86efac] text-green-900 w-full py-3 rounded-[10px] font-medium text-lg shadow-sm transition-colors">
                    Register
                  </button>
                ) : (
                  <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="font-bold text-gray-900 mb-4">Choose Payment Method</h3>
                    <div className="space-y-3 mb-6">
                      <label className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${paymentMethod === 'Transfer' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                        <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod('Transfer')} />
                        <CreditCard className={`mr-4 ${paymentMethod === 'Transfer' ? 'text-green-600' : 'text-gray-400'}`} size={24} />
                        <span className="font-medium text-gray-800">Bank Transfer (VietQR)</span>
                      </label>
                      <label className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${paymentMethod === 'Cash' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                        <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod('Cash')} />
                        <Banknote className={`mr-4 ${paymentMethod === 'Cash' ? 'text-green-600' : 'text-gray-400'}`} size={24} />
                        <span className="font-medium text-gray-800">Cash to Teacher</span>
                      </label>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={() => setShowPayment(false)} className="px-5 py-3 rounded-[10px] bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleFinalSubmit} disabled={!paymentMethod || loading} className="flex-1 bg-green-600 text-white py-3 rounded-[10px] font-medium shadow-sm hover:bg-green-700 transition-colors disabled:bg-gray-300">
                        Confirm Registration
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
        </div>
      </main>
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}