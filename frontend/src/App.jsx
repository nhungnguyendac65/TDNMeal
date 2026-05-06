import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// IMPORT FILES FROM DIRECTORIES
import Login from './pages/Login';

// PARENT PORTAL
import ParentDashboard from './pages/parent-portal/Dashboard';
import MealSchedule from './pages/parent-portal/MealSchedule';
import MealRegistration from './pages/parent-portal/MealRegistration';
import Onboarding from './pages/parent-portal/Onboarding';

// KITCHEN PORTAL
import KitchenDashboard from './pages/kitchen-portal/Dashboard';
import KitchenDishes from './pages/kitchen-portal/DishManagement';
import DailyMenuCreator from './pages/kitchen-portal/DailyMenuCreator';
import WeeklyMenu from './pages/kitchen-portal/WeeklyMenu';
import IngredientManagement from './pages/kitchen-portal/IngredientManagement';

// ADMIN PORTAL
import AdminDashboard from './pages/admin-portal/AdminDashboard';
import UserManagement from './pages/admin-portal/UserManagement';
import StudentManagement from './pages/admin-portal/StudentManagement';
import MenuManagement from './pages/admin-portal/MenuManagement';
import PaymentManagement from './pages/admin-portal/PaymentManagement'; // [ADD PAYMENT ROUTE]

// 1. PUBLIC ROUTE: Prevents logged-in users from accessing the Login page
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (token && userJson) {
    const user = JSON.parse(userJson);
    const userRole = user.Role || user.role;
    
    if (userRole === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'Teacher') return <Navigate to="/admin/students" replace />;
    if (userRole === 'Kitchen') return <Navigate to="/kitchen/dashboard" replace />;
    if (userRole === 'Parent') return <Navigate to="/parent/dashboard" replace />;
  }
  return children;
};

// 2. PROTECTED ROUTE: Role-based access control
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const location = useLocation();
  
  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userJson);
  const userRole = user.Role || user.role;

  // If role is not in the allowed list
  if (!allowedRoles.includes(userRole)) {
    if (userRole === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'Teacher') return <Navigate to="/admin/students" replace />;
    if (userRole === 'Kitchen') return <Navigate to="/kitchen/dashboard" replace />;
    if (userRole === 'Parent') return <Navigate to="/parent/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  // Special for Parents: If Onboarding is completed and user tries to access /onboarding, redirect to Dashboard
  // Unless coming from the "Edit Info" button (with allowUpdate state)
  if (userRole === 'Parent' && location.pathname === '/onboarding') {
    const hasCompleted = localStorage.getItem('hasCompletedOnboarding') === 'true';
    const isUpdating = location.state?.allowUpdate === true;
    
    if (hasCompleted && !isUpdating) {
      return <Navigate to="/parent/dashboard" replace />;
    }
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* ZONE 1: PARENT PORTAL */}
        <Route path="/onboarding" element={
          <ProtectedRoute allowedRoles={['Parent']}>
            <Onboarding />
          </ProtectedRoute>
        } />
        
        <Route path="/parent/dashboard" element={
          <ProtectedRoute allowedRoles={['Parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/parent/schedule" element={
          <ProtectedRoute allowedRoles={['Parent']}>
            <MealSchedule />
          </ProtectedRoute>
        } />
        <Route path="/parent/registrations" element={
          <ProtectedRoute allowedRoles={['Parent']}>
            <MealRegistration />
          </ProtectedRoute>
        } />

        {/* Redirection shortcuts for parents */}
        <Route path="/dashboard" element={<Navigate to="/parent/dashboard" />} />
        <Route path="/schedule" element={<Navigate to="/parent/schedule" />} />
        <Route path="/registrations" element={<Navigate to="/parent/registrations" />} />

        {/* ZONE 2: KITCHEN PORTAL */}
        <Route path="/kitchen/dashboard" element={
          <ProtectedRoute allowedRoles={['Kitchen']}>
            <KitchenDashboard />
          </ProtectedRoute>
        } />
        <Route path="/kitchen/dishes" element={
          <ProtectedRoute allowedRoles={['Kitchen']}>
            <KitchenDishes />
          </ProtectedRoute>
        } />
        <Route path="/kitchen/create-menu" element={
          <ProtectedRoute allowedRoles={['Kitchen']}>
            <DailyMenuCreator />
          </ProtectedRoute>
        } />
        <Route path="/kitchen/weekly-menu" element={
          <ProtectedRoute allowedRoles={['Kitchen']}>
            <WeeklyMenu />
          </ProtectedRoute>
        } />
        <Route path="/kitchen/ingredients" element={
          <ProtectedRoute allowedRoles={['Kitchen']}>
            <IngredientManagement />
          </ProtectedRoute>
        } />

        {/* ZONE 3: ADMIN PORTAL */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute allowedRoles={['Admin', 'Teacher']}>
            <StudentManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/menus" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <MenuManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <ProtectedRoute allowedRoles={['Admin', 'Teacher']}>
            <PaymentManagement />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}