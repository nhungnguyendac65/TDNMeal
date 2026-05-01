import React, { useState, useEffect } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import { 
  Utensils, LayoutDashboard, Calendar, List, Package,
  LogOut, Globe, Plus, Search, Filter, Edit, Trash2, AlertTriangle, X, Save, Image as ImageIcon
, User } from 'lucide-react';
import api from '../../services/api';

export default function DishManagement() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const [lang, setLang] = useState('vi');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tất cả');

  // STATE DỮ LIỆU
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE CHO MODAL THÊM/SỬA
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // STATE CHO HÌNH ẢNH
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // ==========================================
  // [MỚI] STATE QUẢN LÝ DANH SÁCH NGUYÊN LIỆU ĐỘNG
  // ==========================================
  const [ingredientList, setIngredientList] = useState([{ name: '', supplier: '' }]);

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    nameEn: '',
    type: 'Mặn',
    calories: '',
    allergies: ''
  });

  const dishCategories = ['Mặn', 'Chay', 'Rau', 'Canh', 'Phụ'];

  // HÀM LẤY DỮ LIỆU
  const fetchDishes = async () => {
    try {
      const res = await api.get('/kitchen/dishes');
      if (res.data && res.data.data) {
        setDishes(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách món ăn:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const user = JSON.parse(storedUser);

    if (user.Role !== 'Kitchen' && user.role !== 'Kitchen') {
      alert(lang === 'vi' ? "Bạn không có quyền truy cập!" : "Access Denied!");
      localStorage.clear();
      return navigate('/login');
    }
    fetchDishes();
  }, [navigate, lang]);

  // HÀM MỞ MODAL THÊM MỚI
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData({ id: null, name: '', nameEn: '', type: 'Mặn', calories: '', allergies: '' });
    setIngredientList([{ name: '', supplier: '' }]); // Reset danh sách ô nhập về 1 dòng trống
    setImageFile(null);
    setPreviewUrl('');
    setIsModalOpen(true);
  };

  // HÀM MỞ MODAL SỬA
  const handleOpenEditModal = (dish) => {
    setIsEditing(true);
    setFormData({
      id: dish.id,
      name: dish.name,
      nameEn: dish.nameEn || '',
      type: dish.type,
      calories: dish.calories,
      allergies: dish.allergies ? dish.allergies.join(', ') : ''
    });

    // [MỚI] Phân tích chuỗi từ Backend thành mảng các ô nhập liệu
    let parsedList = [{ name: '', supplier: '' }];
    if (dish.ingredients) {
      parsedList = dish.ingredients.split('\n').map(line => {
        const parts = line.split(' - ');
        return {
          name: parts[0] ? parts[0].trim() : '',
          supplier: parts[1] ? parts[1].trim() : ''
        };
      }).filter(item => item.name !== ''); // Lọc bỏ dòng trống

      if (parsedList.length === 0) parsedList = [{ name: '', supplier: '' }];
    }
    setIngredientList(parsedList);

    setImageFile(null);
    setPreviewUrl('');
    setIsModalOpen(true);
  };

  // CÁC HÀM XỬ LÝ Ô NHẬP ĐỘNG
  const handleAddIngredientRow = () => {
    setIngredientList([...ingredientList, { name: '', supplier: '' }]);
  };

  const handleRemoveIngredientRow = (index) => {
    const newList = ingredientList.filter((_, i) => i !== index);
    setIngredientList(newList.length ? newList : [{ name: '', supplier: '' }]); // Giữ lại ít nhất 1 dòng
  };

  const handleChangeIngredientRow = (index, field, value) => {
    const newList = [...ingredientList];
    newList[index][field] = value;
    setIngredientList(newList);
  };

  // HÀM LƯU DỮ LIỆU
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('nameEn', formData.nameEn);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('calories', formData.calories);
      formDataToSend.append('allergies', formData.allergies);

      // [MỚI] Gom mảng các ô nhập thành 1 chuỗi hoàn chỉnh để gửi xuống DB
      const combinedIngredients = ingredientList
        .filter(item => item.name.trim() !== '') // Bỏ qua ô nào không gõ tên nguyên liệu
        .map(item => {
          if (item.supplier.trim() !== '') return `${item.name.trim()} - ${item.supplier.trim()}`;
          return item.name.trim(); // Nếu không có nhà cung cấp thì chỉ gửi nguyên liệu
        })
        .join('\n'); // Nối lại bằng dấu xuống hàng

      formDataToSend.append('ingredients', combinedIngredients);
      formDataToSend.append('supplier', 'Chi tiết trong phần Nguyên liệu');

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (isEditing) {
        await api.put(`/kitchen/dishes/${formData.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/kitchen/dishes', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      fetchDishes();
    } catch (err) {
      console.error("Lỗi lưu món ăn:", err);
      alert(lang === 'vi' ? "Có lỗi xảy ra khi lưu!" : "Error saving dish!");
    }
  };

  // HÀM XÓA DỮ LIỆU
  const handleDelete = async (id) => {
    if (window.confirm(lang === 'vi' ? "Bạn có chắc chắn muốn xóa món này không?" : "Are you sure you want to delete this dish?")) {
      try {
        await api.delete(`/kitchen/dishes/${id}`);
        fetchDishes();
      } catch (err) {
        console.error("Lỗi xóa món ăn:", err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderTypeBadge = (type) => {
    const styles = {
      'Mặn': 'bg-orange-50 text-orange-700 border-orange-100',
      'Chay': 'bg-green-50 text-green-700 border-green-100',
      'Rau': 'bg-green-50 text-green-700 border-green-100',
      'Canh': 'bg-blue-50 text-blue-700 border-blue-100',
      'Phụ': 'bg-yellow-50 text-yellow-700 border-yellow-100',
    };
    const translatedType = lang === 'vi' ? type :
      (type === 'Mặn' ? 'Standard' : type === 'Chay' ? 'Vegan' : type === 'Rau' ? 'Veggie' : type === 'Canh' ? 'Soup' : 'Side/Dessert');
    return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[type] || 'bg-gray-50 text-gray-700'}`}>{translatedType}</span>;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]  text-gray-800 pb-12 relative">

      {/* HEADER NAVIGATION */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Utensils size={20} /></div>
            <span className="font-bold text-lg text-gray-900 hidden sm:block">Kitchen Portal</span>
          </div>

          <div className="hidden lg:flex space-x-6 text-sm font-semibold text-gray-500 h-full">
            <span onClick={() => navigate('/kitchen/dashboard')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              <LayoutDashboard size={16} className="mr-1.5" /> {lang === 'vi' ? 'Tổng quan' : 'Dashboard'}
            </span>
            <span onClick={() => navigate('/kitchen/create-menu')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              {lang === 'vi' ? 'Tạo thực đơn ngày' : 'Create daily menu'}
            </span>
            <span onClick={() => navigate('/kitchen/weekly-menu')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              <Calendar size={16} className="mr-1.5" /> {lang === 'vi' ? 'Thực đơn tuần' : 'Weekly menu'}
            </span>
            <span className="text-orange-600 border-b-2 border-orange-500 h-full flex items-center cursor-default">
              <List size={16} className="mr-1.5" /> {lang === 'vi' ? 'Món ăn' : 'Dishes'}
            </span>
            <span onClick={() => navigate('/kitchen/ingredients')} className="hover:text-orange-600 h-full flex items-center cursor-pointer transition-colors">
              <Package size={16} className="mr-1.5" /> {lang === 'vi' ? 'Nguyên liệu' : 'Ingredients'}
            </span>
          </div>

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

      {/* 2. TOOLBAR (Đã đồng bộ format với Ingredient Management) */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-20">
        <div className="max-w-[1500px] mx-auto px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lang === 'vi' ? 'Quản lý món ăn' : 'Dish Management'}</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">{lang === 'vi' ? 'Thư viện các món ăn tiêu chuẩn để thiết lập thực đơn hàng ngày.' : 'Library of standard dishes to set up daily menus.'}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={lang === 'vi' ? "Tìm kiếm tên món..." : "Search dishes..."} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50/30" 
              />
            </div>
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)} 
              className="border border-gray-200 rounded px-4 py-2 text-sm font-bold text-gray-700 outline-none bg-white h-[38px]"
            >
              <option value="Tất cả">{lang === 'vi' ? 'Tất cả danh mục' : 'All categories'}</option>
              {dishCategories.map(c => (
                <option key={c} value={c}>
                  {lang === 'vi' ? `Món ${c}` : (c === 'Mặn' ? 'Standard' : c === 'Chay' ? 'Vegan' : c === 'Rau' ? 'Veggie' : c === 'Canh' ? 'Soup' : 'Side/Dessert')}
                </option>
              ))}
            </select>
            <button 
              onClick={handleOpenAddModal} 
              className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-800 flex items-center shadow-sm whitespace-nowrap h-[38px]"
            >
              {lang === 'vi' ? 'Thêm món mới' : 'Add New Dish'}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8 w-full space-y-6">

        <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold">{lang === 'vi' ? 'Tên món ăn' : 'Dish Name'}</th>
                  <th className="px-6 py-4 font-bold">{lang === 'vi' ? 'Phân loại' : 'Type'}</th>
                  <th className="px-6 py-4 font-bold">{lang === 'vi' ? 'Calories' : 'Calories'}</th>
                  <th className="px-6 py-4 font-bold">{lang === 'vi' ? 'Nguyên liệu & Nguồn gốc' : 'Ingredients & Origins'}</th>
                  <th className="px-6 py-4 font-bold">{lang === 'vi' ? 'Cảnh báo Dị ứng' : 'Allergies'}</th>
                  <th className="px-6 py-4 font-bold text-right">{lang === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">
                      {lang === 'vi' ? 'Đang tải danh sách món ăn...' : 'Loading dishes...'}
                    </td>
                  </tr>
                ) : dishes.length > 0 ? (
                  dishes
                    .filter(d => {
                      const matchSearch = (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (d.nameEn || '').toLowerCase().includes(searchQuery.toLowerCase());
                      const matchCategory = filterCategory === 'Tất cả' || d.type === filterCategory;
                      return matchSearch && matchCategory;
                    })
                    .map((dish) => (
                    <tr key={dish.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 flex items-center space-x-3">
                        {dish.ImageUrl ? (
                          <img src={`http://localhost:5000${dish.ImageUrl}`} alt="dish" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200"><ImageIcon size={16} className="text-gray-400" /></div>
                        )}
                        <p className="font-bold text-gray-900">{lang === 'vi' ? dish.name : dish.nameEn}</p>
                      </td>
                      <td className="px-6 py-4">{renderTypeBadge(dish.type)}</td>
                      <td className="px-6 py-4 font-medium text-gray-700">{dish.calories} kcal</td>

                      <td className="px-6 py-4 text-gray-600 min-w-[200px] align-top">
                        <div className="whitespace-pre-line text-[13px] leading-relaxed max-h-24 overflow-y-auto">
                          {dish.ingredients}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        {dish.allergies && dish.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {dish.allergies.map((allergy, idx) => (
                              <span key={idx} className="bg-pink-50 text-pink-700 border border-pink-100 px-2 py-0.5 rounded flex items-center text-[11px] font-bold whitespace-nowrap">
                                 {allergy}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">{lang === 'vi' ? 'Không' : 'None'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleOpenEditModal(dish)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={lang === 'vi' ? 'Chỉnh sửa' : 'Edit'}><Edit size={16} /></button>
                          <button onClick={() => handleDelete(dish.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={lang === 'vi' ? 'Xóa' : 'Delete'}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Utensils size={40} className="text-gray-300 mb-3" />
                        <p className="text-base font-medium text-gray-600">{lang === 'vi' ? 'Chưa có món ăn nào trong thư viện.' : 'No dishes found in the library.'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ==========================================
          MODAL: THÊM / SỬA MÓN ĂN
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-sm border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Utensils size={20} className="mr-2 text-orange-500" />
                {isEditing ? (lang === 'vi' ? 'Cập nhật Món Ăn' : 'Edit Dish') : (lang === 'vi' ? 'Thêm Món Mới' : 'Add New Dish')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="dishForm" onSubmit={handleSubmit} className="space-y-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{lang === 'vi' ? 'Tên tiếng Việt *' : 'Vietnamese Name *'}</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded border-gray-200 bg-gray-50 p-3 text-sm focus:ring-orange-500 focus:border-orange-500 transition-colors" placeholder="VD: Thịt kho trứng cút" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{lang === 'vi' ? 'Tên tiếng Anh' : 'English Name'}</label>
                    <input type="text" value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} className="w-full rounded border-gray-200 bg-gray-50 p-3 text-sm focus:ring-orange-500 focus:border-orange-500 transition-colors" placeholder="VD: Braised Pork" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{lang === 'vi' ? 'Phân loại món *' : 'Dish Type *'}</label>
                    <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded border-gray-200 bg-gray-50 p-3 text-sm focus:ring-orange-500 focus:border-orange-500 font-medium text-gray-700">
                      <option value="Mặn">{lang === 'vi' ? 'Món Mặn' : 'Standard'}</option>
                      <option value="Chay">{lang === 'vi' ? 'Món Chay' : 'Vegan'}</option>
                      <option value="Rau">{lang === 'vi' ? 'Món Rau' : 'Veggie'}</option>
                      <option value="Canh">{lang === 'vi' ? 'Món Canh' : 'Soup'}</option>
                      <option value="Phụ">{lang === 'vi' ? 'Tráng miệng / Món phụ' : 'Side / Dessert'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{lang === 'vi' ? 'Calories ước tính (kcal) *' : 'Estimated Calories (kcal) *'}</label>
                    <input type="number" required min="0" value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} className="w-full rounded border-gray-200 bg-gray-50 p-3 text-sm focus:ring-orange-500 focus:border-orange-500 transition-colors" placeholder="VD: 250" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{lang === 'vi' ? 'Hình ảnh món ăn' : 'Dish Image'}</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file" accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setImageFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-sm focus:ring-orange-500 focus:border-orange-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {previewUrl && <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg shadow-sm border border-gray-200" />}
                  </div>
                </div>

                {/* ==============================================
                    [MỚI] Ô NHẬP NGUYÊN LIỆU THEO DẠNG ĐỘNG
                    ============================================== */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {lang === 'vi' ? 'Nguyên liệu & Nhà cung cấp *' : 'Ingredients & Suppliers *'}
                  </label>
                  <div className="space-y-3">
                    {ingredientList.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            placeholder={lang === 'vi' ? "Tên nguyên liệu (VD: Thịt bò)" : "Ingredient (E.g: Beef)"}
                            value={item.name}
                            onChange={(e) => handleChangeIngredientRow(index, 'name', e.target.value)}
                            className="w-full rounded border-gray-200 bg-gray-50 p-2.5 text-sm focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          />
                        </div>
                        <span className="text-gray-400 font-bold">-</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder={lang === 'vi' ? "Nguồn gốc (VD: CoopMart)" : "Supplier (E.g: CoopMart)"}
                            value={item.supplier}
                            onChange={(e) => handleChangeIngredientRow(index, 'supplier', e.target.value)}
                            className="w-full rounded border-gray-200 bg-gray-50 p-2.5 text-sm focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(index)}
                          className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 rounded transition-colors"
                          title={lang === 'vi' ? 'Xóa dòng' : 'Remove row'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Nút cộng thêm dòng */}
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="mt-3 flex items-center text-sm font-bold text-orange-600 bg-orange-50 border border-orange-100 hover:bg-orange-100 px-4 py-2.5 rounded transition-colors"
                  >
                    {lang === 'vi' ? 'Thêm nguyên liệu' : 'Add Ingredient'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                    {lang === 'vi' ? 'Thành phần có thể gây dị ứng' : 'Allergy Warnings'}
                    <span className="ml-2 text-xs font-normal text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full">{lang === 'vi' ? '(Cách nhau bằng dấu phẩy)' : '(Comma separated)'}</span>
                  </label>
                  <input type="text" value={formData.allergies} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })} className="w-full rounded border-gray-200 bg-gray-50 p-3 text-sm focus:ring-orange-500 focus:border-orange-500 transition-colors" placeholder={lang === 'vi' ? "VD: Đậu nành, Đậu phộng, Hải sản" : "E.g: Peanuts, Soy, Seafood"} />
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors shadow-sm">
                {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button form="dishForm" type="submit" className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-orange-600 border border-transparent rounded hover:bg-orange-700 transition-colors shadow-sm">
                <Save size={18} className="mr-2" />
                {lang === 'vi' ? 'Lưu món ăn' : 'Save Dish'}
              </button>
            </div>

          </div>
        </div>
      )}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}