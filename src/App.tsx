import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLoginPage from './components/admin/AdminLoginPage';
import DashboardPage from './components/admin/DashboardPage';
import VegetablesPage from './components/admin/VegetablesPage';
import OrdersPage from './components/admin/OrdersPage';
import SettingsPage from './components/admin/SettingsPage';
import CustomerAuthPage from './components/customer/CustomerAuthPage';
import ForgotPasswordPage from './components/customer/ForgotPasswordPage';
import HomePage from './components/customer/HomePage';
import CartPage from './components/customer/CartPage';
import CheckoutPage from './components/customer/CheckoutPage';
import OrderStatusPage from './components/customer/OrderStatusPage';
import MyOrdersPage from './components/customer/MyOrdersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500' },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            }}
          />
          <Routes>
            {/* Customer auth */}
            <Route path="/login" element={<CustomerAuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Customer routes (require sign in) */}
            <Route
              path="/"
              element={
                <CustomerProtectedRoute>
                  <HomePage />
                </CustomerProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <CustomerProtectedRoute>
                  <CartPage />
                </CustomerProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <CustomerProtectedRoute>
                  <CheckoutPage />
                </CustomerProtectedRoute>
              }
            />
            <Route
              path="/order/:id"
              element={
                <CustomerProtectedRoute>
                  <OrderStatusPage />
                </CustomerProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <CustomerProtectedRoute>
                  <MyOrdersPage />
                </CustomerProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout><DashboardPage /></AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vegetables"
              element={
                <ProtectedRoute>
                  <AdminLayout><VegetablesPage /></AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute>
                  <AdminLayout><OrdersPage /></AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminLayout><SettingsPage /></AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
