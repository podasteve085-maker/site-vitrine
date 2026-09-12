import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingBag, Calendar, Package, FolderTree, Boxes,
  Tag, CreditCard, FileCheck, BarChart3, Settings, LogOut, Menu as MenuIcon, X,
  UtensilsCrossed, Bell
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Notification } from '@/lib/types';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
  { to: '/admin/reservations', label: 'Réservations', icon: Calendar },
  { to: '/admin/products', label: 'Produits', icon: Package },
  { to: '/admin/categories', label: 'Catégories', icon: FolderTree },
  { to: '/admin/stock', label: 'Stock', icon: Boxes },
  { to: '/admin/promotions', label: 'Promotions', icon: Tag },
  { to: '/admin/payments', label: 'Paiements', icon: CreditCard },
  { to: '/admin/proofs', label: 'Preuves de paiement', icon: FileCheck },
  { to: '/admin/stats', label: 'Statistiques', icon: BarChart3 },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifications } = useFetch<Notification[]>(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    return { data: data as Notification[] | null, error };
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-secondary-800">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm">Le Baoulé Gourmand</p>
          <p className="text-xs text-secondary-500">Administration</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.end);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-400 hover:text-white hover:bg-secondary-800'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.to === '/admin/proofs' && notifications && notifications.length > 0 && (
                <span className="bg-error-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-secondary-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-secondary-700 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {profile?.full_name?.charAt(0).toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'Admin'}</p>
            <p className="text-xs text-secondary-500 capitalize">{profile?.role ?? 'admin'}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-secondary-400 hover:text-error-400 hover:bg-secondary-800 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-secondary-950 fixed inset-y-0 left-0 z-50">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-secondary-950/60 z-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-secondary-950 z-50 lg:hidden animate-slide-in-right">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-secondary-400">
              <X className="w-6 h-6" />
            </button>
            {sidebar}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 bg-secondary-950 text-white px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <MenuIcon className="w-6 h-6" />
          </button>
          <span className="font-display font-bold">Administration</span>
          <Link to="/admin/proofs" className="relative p-2">
            <Bell className="w-6 h-6" />
            {notifications && notifications.length > 0 && (
              <span className="absolute top-0 right-0 bg-error-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Link>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
