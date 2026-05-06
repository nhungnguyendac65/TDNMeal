import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ruler, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import api from '../../services/api';

// Standard categories according to documentation
const ALLERGY_CATEGORIES = [
  { id: 1, name: 'Vegetables', suggestions: [] },
  { id: 2, name: 'Seafood', suggestions: ['Shrimp', 'Crab', 'Sea Fish', 'Squid'] },
  { id: 3, name: 'Carbohydrates', suggestions: ['Rice', 'Noodles', 'Vermicelli', 'Bread'] },
  { id: 4, name: 'Beverages', suggestions: [] },
  { id: 5, name: 'Poultry', suggestions: [] },
  { id: 6, name: 'Red Meat', suggestions: [] },
  { id: 7, name: 'Dairy', suggestions: [] },
  { id: 8, name: 'Other', suggestions: [] }
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
        setError('Could not load student information.');
      }
    };
    fetchInitialData();
  }, [navigate]);

  // Handle selecting Main Category (Level 1)
  const toggleCategory = (catId) => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        // If unticking category, also remove its level 2 items
        const category = ALLERGY_CATEGORIES.find(c => c.id === catId);
        if (category.suggestions.length > 0) {
          setSelectedItems(items => items.filter(i => !category.suggestions.includes(i)));
        }
        // If unticking 'Other' (id: 8), clear the text field
        if (catId === 8) setOtherAllergy('');
        
        return prev.filter(id => id !== catId);
      }
      return [...prev, catId];
    });
  };

  // Handle selecting specific item (Level 2)
  const toggleItem = (item) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  // Validation for 'Other' input (No special characters)
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

    // 1. Height / Weight Validation
    if (!height || parseFloat(height) <= 0 || !weight || parseFloat(weight) <= 0) {
      setError('Height and Weight must be greater than 0.');
      return;
    }

    setLoading(true);

    try {
      // 2. Allergy logic correction
      let finalHasAllergy = hasAllergy;
      let allergyDetails = [];

      if (hasAllergy) {
        if (selectedCategories.length === 0) {
          // If nothing selected -> Default: No
          finalHasAllergy = false;
        } else {
          // Build payload
          selectedCategories.forEach(catId => {
            if (catId === 8) {
              // 'Other' group: Get data from text field
              allergyDetails.push({ 
                CategoryID: 8, 
                SpecificNote: otherAllergy.trim() !== '' ? otherAllergy.trim() : null 
              });
            } else {
              // Standard groups: Get ticked items
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

      // 3. Call API
      await api.put(`/students/${studentId}/health-profile`, {
        Height: parseFloat(height),
        Weight: parseFloat(weight),
        HasAllergy: finalHasAllergy,
        AllergyDetails: allergyDetails
      });

      // 4. Save completion status and navigate
      localStorage.setItem('hasCompletedOnboarding', 'true');
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 py-12 px-4 sm:px-6 flex items-center justify-center ">
      <div className="max-w-2xl w-full bg-white p-8 rounded-md shadow-sm border border-green-100">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Update Health Profile</h2>
          <p className="mt-2 text-sm text-gray-500">
            For <strong className="text-green-700">{student?.FullName || '...'}</strong>
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center">{error}</div>}

          {/* BODY INDICES */}
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center border-b pb-2 mb-4">
              <Ruler size={18} className="text-green-600 mr-2" /> Body Indices
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                <input
                  type="number" step="0.1" required min="0.1"
                  value={height} onChange={(e) => setHeight(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <input
                  type="number" step="0.1" required min="0.1"
                  value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* ALLERGIES */}
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center border-b pb-2 mb-4">
              <ShieldAlert size={18} className="text-pink-600 mr-2" /> Food Allergies
            </h3>
            
            <label className="text-sm font-medium text-gray-700">Does your child have any food allergies?</label>
            <div className="mt-3 flex space-x-4">
              <label className={`flex flex-1 items-center justify-center px-4 py-2 border rounded-md cursor-pointer ${!hasAllergy ? 'border-green-500 bg-green-50 text-green-700 font-medium' : 'border-gray-200 text-gray-600'}`}>
                <input type="radio" className="hidden" checked={!hasAllergy} onChange={() => setHasAllergy(false)} />
                No
              </label>
              <label className={`flex flex-1 items-center justify-center px-4 py-2 border rounded-md cursor-pointer ${hasAllergy ? 'border-pink-500 bg-pink-50 text-pink-700 font-medium' : 'border-gray-200 text-gray-600'}`}>
                <input type="radio" className="hidden" checked={hasAllergy} onChange={() => setHasAllergy(true)} />
                Yes
              </label>
            </div>

            {hasAllergy && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <p className="text-sm font-medium text-gray-700">Select food groups:</p>
                <div className="grid grid-cols-2 gap-3">
                  {ALLERGY_CATEGORIES.map(cat => (
                    <div key={cat.id} className="flex flex-col">
                      <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 hover:text-pink-600">
                        <div onClick={() => toggleCategory(cat.id)}>
                          {selectedCategories.includes(cat.id) ? <CheckSquare size={16} className="text-pink-600" /> : <Square size={16} className="text-gray-400" />}
                        </div>
                        <span onClick={() => toggleCategory(cat.id)}>{cat.name}</span>
                      </label>
                      
                      {/* Level 2 suggestions if available */}
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

                {/* SHOW TEXT FIELD ONLY WHEN "OTHER" (ID = 8) IS TICKED */}
                {selectedCategories.includes(8) && (
                  <div className="pt-4 mt-2 border-t border-gray-200">
                    <label className="block text-sm text-gray-600 mb-2">Enter other food allergies (if any):</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={otherAllergy}
                      onChange={handleOtherInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                      placeholder="Max 100 characters, no special characters..."
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
            {loading ? 'Processing...' : 'Complete'}
          </button>
        </form>
      </div>
    </div>
  );
}