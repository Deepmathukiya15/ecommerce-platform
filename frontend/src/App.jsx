import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import SalesOrders from './pages/SalesOrders';
import ManageProducts from './pages/ManageProducts';
import ProductForm from './pages/ProductForm';
import OrdersManage from './pages/OrdersManage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

/** Reset scroll position on navigation */
function ScrollToTop() {
  const { pathname } = useLocation();
  // NOTE: block body on purpose — modern browsers' window.scrollTo returns a
  // Promise (smooth scroll), and an effect must not return a non-cleanup value.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** /my-orders adapts by role: sales → selling tabs, everyone else → purchase history */
function RoleOrders() {
  const { isSales } = useAuth();
  return isSales ? <SalesOrders /> : <MyOrders />;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      {/* pt-16 clears the fixed 64px navbar */}
      <main className="flex-1 pt-16">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Any logged-in role */}
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><RoleOrders /></ProtectedRoute>} />

          {/* Admin + Sales */}
          <Route path="/products/new" element={<ProtectedRoute roles={['admin', 'sales']}><ProductForm /></ProtectedRoute>} />
          <Route path="/products/:id/edit" element={<ProtectedRoute roles={['admin', 'sales']}><ProductForm /></ProtectedRoute>} />
          <Route path="/my-products" element={<ProtectedRoute roles={['admin', 'sales']}><ManageProducts scope="mine" /></ProtectedRoute>} />

          {/* Admin only — the backend rejects other roles with 403 too */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><ManageProducts scope="all" /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><OrdersManage mode="admin" /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
