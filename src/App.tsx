import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';

// Public components
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

// Public pages
import Home from '@/pages/Home';
import Menu from '@/pages/Menu';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import OrderDetail from '@/pages/OrderDetail';
import TrackOrder from '@/pages/TrackOrder';
import Reservation from '@/pages/Reservation';
import Contact from '@/pages/Contact';
import About from '@/pages/About';

// Admin
import AdminLayout from '@/components/admin/AdminLayout';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminStock from '@/pages/admin/AdminStock';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminOrderDetail from '@/pages/admin/AdminOrderDetail';
import AdminPaymentProofs from '@/pages/admin/AdminPaymentProofs';
import AdminReservations from '@/pages/admin/AdminReservations';
import AdminPromotions from '@/pages/admin/AdminPromotions';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminStats from '@/pages/admin/AdminStats';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function ProtectedAdmin({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-secondary-400 text-sm">Chargement...</div>
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public site */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/menu" element={<PublicLayout><Menu /></PublicLayout>} />
        <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
        <Route path="/checkout" element={<PublicLayout><Checkout /></PublicLayout>} />
        <Route path="/order/:id" element={<PublicLayout><OrderDetail /></PublicLayout>} />
        <Route path="/track" element={<PublicLayout><TrackOrder /></PublicLayout>} />
        <Route path="/reservation" element={<PublicLayout><Reservation /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdmin>
              <AdminLayout />
            </ProtectedAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="stock" element={<AdminStock />} />
          <Route path="promotions" element={<AdminPromotions />} />
          <Route path="payments" element={<AdminOrders />} />
          <Route path="proofs" element={<AdminPaymentProofs />} />
          <Route path="stats" element={<AdminStats />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
