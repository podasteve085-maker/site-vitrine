import { useState } from 'react';
import { Calendar, Check, X, Loader2, Phone, Users, Clock } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, RESERVATION_STATUS_LABELS } from '@/lib/format';
import type { Reservation } from '@/lib/types';
import { Loading, EmptyState } from '@/components/Loading';

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'refused', label: 'Refusées' },
  { value: 'completed', label: 'Terminées' },
  { value: 'no_show', label: 'Absent' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-700',
  confirmed: 'bg-success-100 text-success-700',
  refused: 'bg-error-100 text-error-700',
  cancelled: 'bg-secondary-100 text-secondary-700',
  completed: 'bg-secondary-100 text-secondary-700',
  no_show: 'bg-error-100 text-error-700',
};

export default function AdminReservations() {
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: reservations, loading, refetch } = useFetch<Reservation[]>(async () => {
    let query = supabase.from('reservations').select('*').eq('restaurant_id', RESTAURANT_ID).order('reservation_date', { ascending: true });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error } = await query.limit(100);
    return { data: data as Reservation[] | null, error };
  }, [statusFilter]);

  const handleAction = async (reservation: Reservation, action: 'confirm' | 'refuse' | 'complete' | 'no_show') => {
    if (!profile) return;
    setActionLoading(reservation.id);
    const statusMap = { confirm: 'confirmed', refuse: 'refused', complete: 'completed', no_show: 'no_show' };
    const { error } = await supabase
      .from('reservations')
      .update({ status: statusMap[action], updated_at: new Date().toISOString() })
      .eq('id', reservation.id);
    if (error) { alert('Erreur: ' + error.message); setActionLoading(null); return; }

    // Audit log
    await supabase.from('audit_logs').insert({
      restaurant_id: RESTAURANT_ID,
      admin_user_id: profile.user_id,
      admin_name: profile.full_name,
      action: 'reservation_' + action,
      entity_type: 'reservation',
      entity_id: reservation.id,
      details: { customer_name: reservation.customer_name, date: reservation.reservation_date },
    });

    refetch();
    setActionLoading(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-secondary-900">Réservations</h1>
        <button onClick={refetch} className="btn-ghost text-sm">Actualiser</button>
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

      {loading ? <Loading /> : reservations && reservations.length > 0 ? (
        <div className="space-y-3">
          {reservations.map((res) => (
            <div key={res.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-secondary-900">{res.customer_name}</h3>
                      <span className={`badge text-xs ${STATUS_COLORS[res.status] ?? 'bg-secondary-100'}`}>
                        {RESERVATION_STATUS_LABELS[res.status] ?? res.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-secondary-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(res.reservation_date)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {res.reservation_time}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {res.party_size} pers.</span>
                    </div>
                    <a href={`tel:${res.customer_phone}`} className="flex items-center gap-1 text-xs text-primary-600 mt-1 hover:underline">
                      <Phone className="w-3.5 h-3.5" /> {res.customer_phone}
                    </a>
                    {res.notes && <p className="text-xs text-secondary-400 mt-1 italic">"{res.notes}"</p>}
                  </div>
                </div>

                {res.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(res, 'confirm')}
                      disabled={actionLoading === res.id}
                      className="p-2 bg-success-50 text-success-600 rounded-lg hover:bg-success-100 transition-colors disabled:opacity-50"
                      title="Confirmer"
                    >
                      {actionLoading === res.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleAction(res, 'refuse')}
                      disabled={actionLoading === res.id}
                      className="p-2 bg-error-50 text-error-600 rounded-lg hover:bg-error-100 transition-colors disabled:opacity-50"
                      title="Refuser"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {res.status === 'confirmed' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(res, 'complete')}
                      disabled={actionLoading === res.id}
                      className="px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-lg text-xs font-medium hover:bg-secondary-200 transition-colors"
                    >
                      Terminer
                    </button>
                    <button
                      onClick={() => handleAction(res, 'no_show')}
                      disabled={actionLoading === res.id}
                      className="px-3 py-1.5 bg-error-50 text-error-600 rounded-lg text-xs font-medium hover:bg-error-100 transition-colors"
                    >
                      Absent
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune réservation" message="Les réservations des clients apparaîtront ici." />
      )}
    </div>
  );
}
