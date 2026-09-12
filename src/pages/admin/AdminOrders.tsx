import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, ArrowRight } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/format';
import type { Order } from '@/lib/types';
import { Loading, EmptyState } from '@/components/Loading';

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'new', label: 'Nouvelles' },
  { value: 'payment_to_verify', label: 'À vérifier' },
  { value: 'preparing', label: 'En préparation' },
  { value: 'ready', label: 'Prêtes' },
  { value: 'delivering', label: 'En livraison' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'completed', label: 'Terminées' },
  { value: 'cancelled', label: 'Annulées' },
  { value: 'refused', label: 'Refusées' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-primary-100 text-primary-700',
  awaiting_payment: 'bg-secondary-100 text-secondary-700',
  payment_to_verify: 'bg-warning-100 text-warning-700',
  payment_confirmed: 'bg-success-100 text-success-700',
  preparing: 'bg-primary-100 text-primary-700',
  ready: 'bg-success-100 text-success-700',
  delivering: 'bg-primary-100 text-primary-700',
  delivered: 'bg-success-100 text-success-700',
  completed: 'bg-secondary-100 text-secondary-700',
  cancelled: 'bg-error-100 text-error-700',
  refused: 'bg-error-100 text-error-700',
};

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders, loading, refetch } = useFetch<Order[]>(async () => {
    let query = supabase.from('orders').select('*').eq('restaurant_id', RESTAURANT_ID).order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('order_status', statusFilter);
    if (search.trim()) query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    const { data, error } = await query.limit(100);
    return { data: data as Order[] | null, error };
  }, [statusFilter, search]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-secondary-900">Commandes</h1>
        <button onClick={refetch} className="btn-ghost text-sm">Actualiser</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="N° commande, nom, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              statusFilter === filter.value
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/admin/orders/${order.id}`}
              className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-secondary-900 text-sm">{order.order_number}</p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {order.customer_name} • {order.customer_phone}
                  </p>
                  <p className="text-xs text-secondary-400">{formatDateTime(order.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-primary-600">{formatPrice(order.total)}</p>
                  <div className="flex gap-1 justify-end mt-1">
                    <span className={`badge text-xs ${STATUS_COLORS[order.order_status] ?? 'bg-secondary-100'}`}>
                      {ORDER_STATUS_LABELS[order.order_status] ?? order.order_status}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-secondary-400" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune commande" message="Les commandes apparaîtront ici." />
      )}
    </div>
  );
}
