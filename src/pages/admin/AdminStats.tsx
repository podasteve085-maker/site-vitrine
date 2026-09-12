import { useState } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Loader2 } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/format';
import { Loading } from '@/components/Loading';

interface StatsData {
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
  ordersByStatus: Record<string, number>;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
}

const PERIODS = [
  { value: 'today', label: "Aujourd'hui", days: 1 },
  { value: 'week', label: '7 jours', days: 7 },
  { value: 'month', label: '30 jours', days: 30 },
];

export default function AdminStats() {
  const [period, setPeriod] = useState('week');

  const { data: stats, loading } = useFetch<StatsData>(async () => {
    const periodConfig = PERIODS.find((p) => p.value === period) ?? PERIODS[1];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodConfig.days);
    const startISO = startDate.toISOString();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, total, order_status, created_at')
      .eq('restaurant_id', RESTAURANT_ID)
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    if (error) return { data: null, error };

    const ordersList = orders ?? [];
    const totalRevenue = ordersList.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = ordersList.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    ordersList.forEach((o) => {
      ordersByStatus[o.order_status] = (ordersByStatus[o.order_status] ?? 0) + 1;
    });

    // Daily revenue
    const dayMap = new Map<string, { revenue: number; orders: number }>();
    ordersList.forEach((o) => {
      const dateKey = new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const existing = dayMap.get(dateKey) ?? { revenue: 0, orders: 0 };
      dayMap.set(dateKey, { revenue: existing.revenue + o.total, orders: existing.orders + 1 });
    });
    const dailyRevenue = Array.from(dayMap.entries()).map(([date, val]) => ({ date, ...val }));

    // Top products
    const orderIds = ordersList.map((o) => o.id);
    let topProducts: { name: string; qty: number; revenue: number }[] = [];
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, quantity, subtotal')
        .in('order_id', orderIds);
      const productMap = new Map<string, { qty: number; revenue: number }>();
      (items ?? []).forEach((item: { product_name: string; quantity: number; subtotal: number }) => {
        const existing = productMap.get(item.product_name) ?? { qty: 0, revenue: 0 };
        productMap.set(item.product_name, { qty: existing.qty + item.quantity, revenue: existing.revenue + item.subtotal });
      });
      topProducts = Array.from(productMap.entries())
        .map(([name, val]) => ({ name, ...val }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    }

    return {
      data: {
        totalRevenue,
        totalOrders,
        avgOrder,
        ordersByStatus,
        dailyRevenue,
        topProducts,
      },
      error: null,
    };
  }, [period]);

  const maxRevenue = Math.max(...(stats?.dailyRevenue.map((d) => d.revenue) ?? [1]), 1);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-secondary-900">Statistiques</h1>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.value ? 'bg-primary-600 text-white' : 'bg-white text-secondary-700 hover:bg-secondary-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loading /> : stats && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-5">
              <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-success-600" />
              </div>
              <p className="text-2xl font-bold text-secondary-900">{formatPrice(stats.totalRevenue)}</p>
              <p className="text-xs text-secondary-500 mt-1">Chiffre d'affaires</p>
            </div>
            <div className="card p-5">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-2xl font-bold text-secondary-900">{stats.totalOrders}</p>
              <p className="text-xs text-secondary-500 mt-1">Commandes</p>
            </div>
            <div className="card p-5">
              <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-secondary-600" />
              </div>
              <p className="text-2xl font-bold text-secondary-900">{formatPrice(stats.avgOrder)}</p>
              <p className="text-xs text-secondary-500 mt-1">Panier moyen</p>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" /> Ventes par jour
            </h2>
            {stats.dailyRevenue.length > 0 ? (
              <div className="space-y-2">
                {stats.dailyRevenue.map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-secondary-500 w-12 shrink-0">{day.date}</span>
                    <div className="flex-1 bg-secondary-100 rounded-full h-7 overflow-hidden relative">
                      <div
                        className="bg-primary-500 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max((day.revenue / maxRevenue) * 100, 5)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{day.orders} cmd</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-secondary-700 w-24 text-right shrink-0">{formatPrice(day.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary-400 text-center py-6">Aucune vente sur cette période.</p>
            )}
          </div>

          {/* Top products */}
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-secondary-900 mb-4">Produits les plus vendus</h2>
            {stats.topProducts.length > 0 ? (
              <div className="space-y-2">
                {stats.topProducts.map((product, idx) => (
                  <div key={product.name} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                    <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-secondary-900">{product.name}</span>
                    <span className="text-xs text-secondary-500">{product.qty} vendus</span>
                    <span className="text-sm font-bold text-primary-600">{formatPrice(product.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary-400 text-center py-6">Aucune vente sur cette période.</p>
            )}
          </div>

          {/* Orders by status */}
          <div className="card p-6">
            <h2 className="font-semibold text-secondary-900 mb-4">Commandes par statut</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
                  <span className="text-sm text-secondary-600">{ORDER_STATUS_LABELS[status] ?? status}</span>
                  <span className="font-bold text-secondary-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
