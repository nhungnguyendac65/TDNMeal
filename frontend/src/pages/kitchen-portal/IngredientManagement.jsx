import React, { useState, useEffect } from 'react';
import ProfileModal from '../../components/ProfileModal';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Package, LayoutDashboard, List, Calendar, LogOut, Globe,
    Plus, Search, Edit, Trash2, AlertTriangle, CheckCircle, X
, User } from 'lucide-react';
import api from '../../services/api';

export default function IngredientManagement() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const navigate = useNavigate();
    const [lang, setLang] = useState('en');

    // Data States
    const [ingredients, setIngredients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Modal States (Add/Edit popup)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        Name: '', Category: 'Meat & Fish', StockQuantity: 0, Unit: 'kg', Supplier: '', MinStockLevel: 5
    });

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000); // Auto-close after 3s
    };
    // ==========================================

    const categories = ['Meat & Fish', 'Vegetables', 'Spices', 'Dry Goods', 'Dairy & Water', 'Other'];
    const units = ['kg', 'gram', 'liter', 'ml', 'bottle', 'pack', 'box', 'piece'];

    // Fetch data from warehouse
    const fetchIngredients = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/kitchen/ingredients');
            setIngredients(res.data?.data || []);
        } catch (error) {
            console.error("Error fetching ingredients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchIngredients(); }, []);

    // Filter data
    const filteredIngredients = ingredients.filter(item => {
        const matchSearch = item.Name?.toLowerCase().includes(searchTerm.toLowerCase()) || item.Supplier?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = filterCategory === 'All' || item.Category === filterCategory;
        return matchSearch && matchCategory;
    });

    // Handle Input Form
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Open add modal
    const handleAddNew = () => {
        setEditingId(null);
        setFormData({ Name: '', Category: 'Meat & Fish', StockQuantity: 0, Unit: 'kg', Supplier: '', MinStockLevel: 5 });
        setIsModalOpen(true);
    };

    // Open edit modal
    const handleEdit = (item) => {
        setEditingId(item.id || item.IngredientID);
        setFormData({
            Name: item.Name, Category: item.Category,
            StockQuantity: item.StockQuantity, Unit: item.Unit,
            Supplier: item.Supplier, MinStockLevel: item.MinStockLevel || 5
        });
        setIsModalOpen(true);
    };

    // Save (Add/Edit)
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/kitchen/ingredients/${editingId}`, formData);
                showToast("Stock updated successfully!", "success");
            } else {
                await api.post('/kitchen/ingredients', formData);
                showToast("New ingredient added!", "success");
            }
            setIsModalOpen(false);
            fetchIngredients();
        } catch (error) {
            showToast("An error occurred, please try again!", "error");
        }
    };

    // Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this ingredient from stock?")) return;
        try {
            await api.delete(`/kitchen/ingredients/${id}`);
            showToast("Ingredient deleted from stock!", "success");
            fetchIngredients();
        } catch (error) {
            showToast("Error deleting data!", "error");
        }
    };

    // Logout handler
    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    return (
        <div className="min-h-screen bg-[#f9fafb] flex flex-col  text-gray-800 pb-10 relative">

            {/* 1. NAVBAR */}
            <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
                <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Utensils size={20} /></div>
                        <span className="font-bold text-lg text-gray-900 hidden sm:block">Quản lý bếp ăn</span>
                    </div>
                    <div className="hidden lg:flex space-x-6 text-sm font-semibold text-gray-500 h-full">
                        <Link to="/kitchen/dashboard" className="hover:text-orange-600 h-full flex items-center transition-colors"><LayoutDashboard size={16} className="mr-1.5" /> Tổng quan</Link>
                        <Link to="/kitchen/create-menu" className="hover:text-orange-600 h-full flex items-center transition-colors"><Plus size={16} className="mr-1.5" /> Tạo thực đơn ngày</Link>
                        <Link to="/kitchen/weekly-menu" className="hover:text-orange-600 h-full flex items-center transition-colors"><Calendar size={16} className="mr-1.5" /> Thực đơn tuần</Link>
                        <Link to="/kitchen/dishes" className="hover:text-orange-600 h-full flex items-center transition-colors"><List size={16} className="mr-1.5" /> Món ăn</Link>
                        <span className="text-orange-600 border-b-2 border-orange-500 h-full flex items-center cursor-default"><Package size={16} className="mr-1.5" /> Nguyên liệu</span>
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

            {/* 2. TOOLBAR */}
            <div className="bg-white border-b border-gray-200 shadow-sm z-20">
                <div className="max-w-[1500px] mx-auto px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Ingredient Inventory</h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">Track inventory, imports, exports, and low stock warnings.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Search name, supplier..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                        </div>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border border-gray-200 rounded px-4 py-2 text-sm font-bold text-gray-700 outline-none">
                            <option value="All">All categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button onClick={handleAddNew} className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-800 flex items-center shadow-sm whitespace-nowrap">
                            Import Stock
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. DATA TABLE */}
            <main className="flex-1 px-4 sm:px-6 py-8 max-w-[1500px] mx-auto w-full">
                <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-black text-gray-500 tracking-wider">
                                    <th className="p-4 w-1/3">Ingredient Name</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Stock</th>
                                    <th className="p-4">Supplier</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {isLoading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">Loading stock data...</td></tr>
                                ) : filteredIngredients.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-medium">No ingredients found!</td></tr>
                                ) : (
                                    filteredIngredients.map((item) => {
                                        const isLowStock = item.StockQuantity <= (item.MinStockLevel || 5);
                                        return (
                                            <tr key={item.id || item.IngredientID} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-4 font-bold text-gray-900">{item.Name}</td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold border border-gray-200">{item.Category}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-lg font-black text-gray-800">{item.StockQuantity}</span>
                                                    <span className="text-gray-500 font-medium ml-1.5">{item.Unit}</span>
                                                </td>
                                                <td className="p-4 text-gray-600">{item.Supplier || 'Unknown'}</td>
                                                <td className="p-4 text-center">
                                                    {isLowStock ? (
                                                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-200">
                                                             Low Stock
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-green-200">
                                                            Stable
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(item.id || item.IngredientID)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* 4. ADD/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-md shadow-sm w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Package className="text-orange-500" size={20} /> {editingId ? 'Update Ingredient' : 'New Stock Import'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Ingredient Name *</label>
                                <input required type="text" name="Name" value={formData.Name} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium" placeholder="Ex: Tomato" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Category</label>
                                    <select name="Category" value={formData.Category} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded text-sm font-medium outline-none bg-white">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Unit</label>
                                    <select name="Unit" value={formData.Unit} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded text-sm font-medium outline-none bg-white">
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Current Stock *</label>
                                    <input required type="number" step="0.1" name="StockQuantity" value={formData.StockQuantity} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold text-orange-600" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Min Stock Warning</label>
                                    <input type="number" step="0.1" name="MinStockLevel" value={formData.MinStockLevel} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded outline-none text-sm font-medium text-red-500" title="Warning if stock falls below this level" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Supplier</label>
                                <input type="text" name="Supplier" value={formData.Supplier} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium" placeholder="Ex: Vinmart, Co.opmart..." />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded font-bold hover:bg-gray-800 transition-colors shadow-sm">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================
                [NEWLY ADDED] TOAST NOTIFICATION
                ========================================== */}
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