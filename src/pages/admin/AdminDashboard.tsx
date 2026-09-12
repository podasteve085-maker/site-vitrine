import { Link } from 'react-router-dom';
import { ShoppingBag, Calendar, DollarSign, TrendingUp, Package, Clock, ArrowRight, FileCheck } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/format';
import type { Order, Reservation, Product } from '@/lib/types';
import { Loading } from '@/components/Loading';

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  pendingReservations: number;
  avgOrderValue: number;
  topProducts: { product_name: string; total_sold: number }[];
  recentOrders: Order[];
  upcomingReservations: Reservation[];
  lowStockProducts: Product[];
}

export default function AdminDashboard() {
  const { data: stats, loading } = useFetch<DashboardStats>(async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [todayOrdersRes, weekOrdersRes, monthOrdersRes, reservationsRes, topProductsRes, recentOrdersRes, lowStockRes] = await Promise.all([
      supabase.from('orders').select('total, order_number, created_at').eq('restaurant_id', RESTAURANT_ID).gte('created_at', todayStart),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('restaurant_id', RESTAURANT_ID).gte('created_at', weekStart),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('restaurant_id', RESTAURANT_ID).gte('created_at', monthStart),
      supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('restaurant_id', RESTAURANT_ID).eq('status', 'pending'),
      supabase.from('order_items').select('product_name, quantity').eq('order_id', 'in', (await supabase.from('orders').select('id').eq('restaurant_id', RESTAURANT_ID).gte('created_at', monthStart)).data?.map((o: { id: string }) => o.id) ?? []),
      supabase.from('orders').select('*').eq('restaurant_id', RESTAURANT_ID).order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('*').eq('restaurant_id', RESTAURANT_ID).eq('is_active', true).lt('stock_quantity', 5).order('stock_quantity', { ascending: true }).limit(5),
    ]);

    const todayOrders = todayOrdersRes.data ?? [];
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

    // Aggregate top products
    const productMap = new Map<string, number>();
    (topProductsRes.data ?? []).forEach((item: { product_name: string; quantity: number }) => {
      productMap.set(item.product_name, (productMap.get(item.product_name) ?? 0) + item.quantity);
    });
    const topProducts = Array.from(productMap.entries())
      .map(([product_name, total_sold]) => ({ product_name, total_sold }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);

    return {
      data: {
        todayRevenue,
        todayOrders: todayOrders.length,
        weekOrders: weekOrdersRes.count ?? 0,
        monthOrders: monthOrdersRes.count ?? 0,
        pendingReservations: reservationsRes.count ?? 0,
        avgOrderValue,
        topProducts,
        recentOrders: (recentOrdersRes.data as Order[]) ?? [],
        upcomingReservations: [],
        lowStockProducts: (lowStockRes.data as Product[]) ?? [],
      },
      error: null,
    };
  });

  if (loading) return <Loading />;

  const cards = [
    { label: "Chiffre d'affaires (aujourd'hui)", value: formatPrice(stats?.todayRevenue ?? 0), icon: DollarSign, color: 'bg-success-100 text-success-700' },
    { label: "Commandes (aujourd'hui)", value: String(stats?.todayOrders ?? 0), icon: ShoppingBag, color: 'bg-primary-100 text-primary-700' },
    { label: 'Commandes (7 jours)', value: String(stats?.weekOrders ?? 0), icon: TrendingUp, color: 'bg-secondary-100 text-secondary-700' },
    { label: 'Commandes (mois)', value: String(stats?.monthOrders ?? 0), icon: Calendar, color: 'bg-secondary-100 text-secondary-700' },
    { label: 'Panier moyen', value: formatPrice(stats?.avgOrderValue ?? 0), icon: TrendingUp, color: 'bg-primary-100 text-primary-700' },
    { label: 'Réservations en attente', value: String(stats?.pendingReservations ?? 0), icon: Calendar, color: 'bg-warning-100 text-warning-700' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-secondary-900 mb-6">Tableau de bord</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-secondary-900">{card.value}</p>
              <p className="text-xs text-secondary-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-secondary-900">Commandes récentes</h2>
            <Link to="/admin/orders" className="text-sm text-primary-600 hover:gap-2 flex items-center gap-1 transition-all">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-2">
              {stats.recentOrders.map((order) => (
                <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{order.order_number}</p>
                    <p className="text-xs text-secondary-500">{order.customer_name} • {formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary-600">{formatPrice(order.total)}</p>
                    <span className="text-xs text-secondary-500">{ORDER_STATUS_LABELS[order.order_status] ?? order.order_status}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary-400 text-center py-6">Aucune commande récente.</p>
          )}
        </div>

        {/* Top products */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary-900 mb-4">Produits les plus vendus (mois)</h2>
          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <div className="space-y-2">
              {stats.topProducts.map((product, idx) => (
                <div key={product.product_name} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                  <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-secondary-900">{product.product_name}</span>
                  <span className="text-sm text-secondary-500">{product.total_sold} vendus</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary-400 text-center py-6">Aucune vente ce mois-ci.</p>
          )}
        </div>

        {/* Low stock */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-warning-500" /> Stock faible
            </h2>
            <Link to="/admin/stock" className="text-sm text-primary-600 hover:gap-2 flex items-center gap-1 transition-all">
              Gérer le stock <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-warning-50 rounded-xl border border-warning-200">
                  <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-warning-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">{product.name}</p>
                    <p className="text-xs text-warning-700 font-semibold">
                      {product.stock_quantity} en stock {product.stock_quantity === 0 && '(rupture)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary-400 text-center py-6">Tous les stocks sont suffisants.</p>
          )}
        </div>
      </div>
    </div>
  );
}
