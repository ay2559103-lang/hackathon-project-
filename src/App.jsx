import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import ProductsPage from './pages/ProductsPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import AIAssistantPage from './pages/AIAssistantPage';
import AddProductPage from './pages/AddProductPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import NearbySellersPage from './pages/NearbySellersPage';
import DeliveryDashboardPage from './pages/DeliveryDashboardPage';
import OrdersPage from './pages/OrdersPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Imports
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ADMIN ROUTES */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboardPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  {/* Add more admin routes here later */}
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } 
        />

        {/* STANDARD APP ROUTES */}
        <Route 
          path="*" 
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/nearby" element={<NearbySellersPage />} />

                {/* Protected Customer/Seller Routes */}
                <Route path="/products" element={<ProductsPage />} />
                <Route 
                  path="/orders" 
                  element={
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/track/:orderId" 
                  element={
                    <ProtectedRoute>
                      <OrderTrackingPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />

                {/* Seller Only Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['seller']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ai-assistant" 
                  element={
                    <ProtectedRoute allowedRoles={['seller']}>
                      <AIAssistantPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/add-product" 
                  element={
                    <ProtectedRoute allowedRoles={['seller']}>
                      <AddProductPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Delivery Partner Routes */}
                <Route 
                  path="/delivery" 
                  element={
                    <ProtectedRoute allowedRoles={['delivery']}>
                      <DeliveryDashboardPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

