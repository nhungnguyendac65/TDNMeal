import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ruler, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import api from '../../services/api';

// Danh mục chuẩn theo tài liệu (Kèm gợi ý cấp 2)
const ALLERGY_CATEGORIES = [
  { id: 1, name: 'Rau củ', suggestions: [] },
  { id: 2, name: 'Hải sản', suggestions: ['Tôm', 'Cua', 'Cá biển', 'Mực'] },
  { id: 3, name: 'Các loại tinh bột', suggestions: ['Gạo', 'Mì', 'Bún', 'Bánh mì'] },
  { id: 4, name: 'Đồ uống', suggestions: [] },
  { id: 5, name: 'Thịt gia cầm', suggestions: [] },
  { id: 6, name: 'Thịt đỏ', suggestions: [] },
  { id: 7, name: 'Sữa và chế phẩm từ sữa', suggestions: [] },
  { id: 8, name: 'Khác', suggestions: [] }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  const [hasAllergy, setHasAllergy] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [otherAllergy, setOtherAllergy] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return navigate('/login');
      
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      try {
        const response = await api.get(`/students/parent/${parsedUser.UserID || parsedUser.id}`);
        if (response.data.data?.length > 0) {
          setStudent(response.data.data[0]);
        }
      } catch (err) {
        setError('Không thể tải thông tin học sinh.');
      }
    };
    fetchInitialData();
  }, [navigate]);

  // Handle chọn Nhóm chính (Cấp 1)
  const toggleCategory = (catId) => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        // Nếu bỏ tick nhóm, xóa luôn các món cấp 2 thuộc nhóm đó
        const category = ALLERGY_CATEGORIES.find(c => c.id === catId);
        if (category.suggestions.length > 0) {
          setSelectedItems(items => items.filter(i => !category.suggestions.includes(i)));
        }
        // Nếu bỏ tick nhóm Khác (id: 8), xóa luôn nội dung ô text
        if (catId === 8) setOtherAllergy('');
        
        return prev.filter(id => id !== catId);
      }
      return [...prev, catId];
    });
  };

  // Handle chọn Món cụ thể (Cấp 2)
  const toggleItem = (item) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  // Validation nhập liệu ô Khác (Ko ký tự đặc biệt)
  const handleOtherInputChange = (e) => {
    const val = e.target.value;
    const regex = /^[a-zA-Z0-9\s,A-ZÀ-Ỹà-ỹ]*$/;
    if (regex.test(val) || val === '') {
      setOtherAllergy(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validation Chiều cao / Cân nặng
    if (!height || parseFloat(height) <= 0 || !weight || parseFloat(weight) <= 0) {
      setError('Chiều cao và Cân nặng phải là số lớn hơn 0.');
      return;
    }

    setLoading(true);

    try {
      // 2. Logic tự động sửa sai Dị ứng
      let finalHasAllergy = hasAllergy;
      let allergyDetails = [];

      if (hasAllergy) {
        if (selectedCategories.length === 0) {
          // Nếu bỏ qua không chọn gì -> Mặc định: Không
          finalHasAllergy = false;
        } else {
          // Build payload
          selectedCategories.forEach(catId => {
            if (catId === 8) {
              // Nhóm Khác: Lấy dữ liệu từ ô text
              allergyDetails.push({ 
                CategoryID: 8, 
                SpecificNote: otherAllergy.trim() !== '' ? otherAllergy.trim() : null 
              });
            } else {
              // Các nhóm chuẩn: Lấy các món đã tick
              const category = ALLERGY_CATEGORIES.find(c => c.id === catId);
              const specificItems = selectedItems.filter(item => category.suggestions.includes(item));
              
              allergyDetails.push({ 
                CategoryID: catId,
                SpecificNote: specificItems.length > 0 ? specificItems.join(', ') : null
              });
            }
          });
        }
      }

      const studentId = student?.StudentID || student?.id;

      // 3. Gọi API
      await api.put(`/students/${studentId}/health-profile`, {
        Height: parseFloat(height),
        Weight: parseFloat(weight),
        HasAllergy: finalHasAllergy,
        AllergyDetails: allergyDetails
      });

      // 4. Lưu trạng thái hoàn tất và chuyển trang
      localStorage.setItem('hasCompletedOnboarding', 'true');
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 py-12 px-4 sm:px-6 flex items-center justify-center ">
      <div className="max-w-2xl w-full bg-white p-8 rounded-md shadow-sm border border-green-100">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Cập nhật hồ sơ sức khỏe</h2>
          <p className="mt-2 text-sm text-gray-500">
            Dành cho bé <strong className="text-green-700">{student?.FullName || '...'}</strong>
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center">{error}</div>}

          {/* CHỈ SỐ CƠ THỂ */}
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center border-b pb-2 mb-4">
              <Ruler size={18} className="text-green-600 mr-2" /> Chỉ số cơ thể
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Chiều cao (cm)</label>
                <input
                  type="number" step="0.1" required min="0.1"
                  value={height} onChange={(e) => setHeight(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cân nặng (kg)</label>
                <input
                  type="number" step="0.1" required min="0.1"
                  value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* DỊ ỨNG */}
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center border-b pb-2 mb-4">
              <ShieldAlert size={18} className="text-pink-600 mr-2" /> Dị ứng thực phẩm
            </h3>
            
            <label className="text-sm font-medium text-gray-700">Con có dị ứng với bất kỳ loại thức ăn nào không?</label>
            <div className="mt-3 flex space-x-4">
              <label className={`flex flex-1 items-center justify-center px-4 py-2 border rounded-md cursor-pointer ${!hasAllergy ? 'border-green-500 bg-green-50 text-green-700 font-medium' : 'border-gray-200 text-gray-600'}`}>
                <input type="radio" className="hidden" checked={!hasAllergy} onChange={() => setHasAllergy(false)} />
                Không
              </label>
              <label className={`flex flex-1 items-center justify-center px-4 py-2 border rounded-md cursor-pointer ${hasAllergy ? 'border-pink-500 bg-pink-50 text-pink-700 font-medium' : 'border-gray-200 text-gray-600'}`}>
                <input type="radio" className="hidden" checked={hasAllergy} onChange={() => setHasAllergy(true)} />
                Có
              </label>
            </div>

            {hasAllergy && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <p className="text-sm font-medium text-gray-700">Chọn nhóm thực phẩm:</p>
                <div className="grid grid-cols-2 gap-3">
                  {ALLERGY_CATEGORIES.map(cat => (
                    <div key={cat.id} className="flex flex-col">
                      <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 hover:text-pink-600">
                        <div onClick={() => toggleCategory(cat.id)}>
                          {selectedCategories.includes(cat.id) ? <CheckSquare size={16} className="text-pink-600" /> : <Square size={16} className="text-gray-400" />}
                        </div>
                        <span onClick={() => toggleCategory(cat.id)}>{cat.name}</span>
                      </label>
                      
                      {/* Gợi ý cấp 2 nếu có */}
                      {selectedCategories.includes(cat.id) && cat.suggestions.length > 0 && (
                        <div className="ml-6 mt-2 flex flex-wrap gap-2">
                          {cat.suggestions.map(item => (
                            <span 
                              key={item}
                              onClick={() => toggleItem(item)}
                              className={`px-2 py-1 text-xs rounded-full border cursor-pointer transition-colors ${selectedItems.includes(item) ? 'bg-pink-100 border-pink-300 text-pink-800' : 'bg-white border-gray-300 text-gray-600'}`}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* CHỈ HIỂN THỊ Ô TEXT KHI TICK VÀO NHÓM "KHÁC" (ID = 8) */}
                {selectedCategories.includes(8) && (
                  <div className="pt-4 mt-2 border-t border-gray-200">
                    <label className="block text-sm text-gray-600 mb-2">Nhập thực phẩm dị ứng khác (nếu có):</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={otherAllergy}
                      onChange={handleOtherInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                      placeholder="Tối đa 100 ký tự, không ký tự đặc biệt..."
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit" disabled={loading || !student}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-yellow-300 hover:bg-yellow-400 disabled:opacity-70"
          >
            {loading ? 'Đang xử lý...' : 'Hoàn tất'}
          </button>
        </form>
      </div>
    </div>
  );
}