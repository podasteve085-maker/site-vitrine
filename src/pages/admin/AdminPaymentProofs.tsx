import { Link } from 'react-router-dom';
import { FileCheck, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import { formatPrice, formatDateTime, PAYMENT_METHOD_LABELS } from '@/lib/format';
import { Loading, EmptyState } from '@/components/Loading';

interface ProofWithOrder {
  id: string;
  file_url: string;
  declared_amount: number | null;
  transaction_reference: string | null;
  payer_phone: string | null;
  payment_method: string | null;
  verified: boolean;
  created_at: string;
  order_id: string;
  order_number: string;
  order_total: number;
  customer_name: string;
  customer_phone: string;
  payment_status: string;
  order_status: string;
}

export default function AdminPaymentProofs() {
  const { data: proofs, loading, refetch } = useFetch<ProofWithOrder[]>(async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, order_number, total, customer_name, customer_phone, payment_status, order_status, payment_method')
      .eq('restaurant_id', RESTAURANT_ID)
      .in('payment_status', ['payment_to_verify', 'confirmed', 'refused'])
      .order('created_at', { ascending: false });

    if (!ordersData || ordersData.length === 0) return { data: [], error: null };

    const orderIds = ordersData.map((o) => o.id);
    const { data: proofsData } = await supabase
      .from('payment_proofs')
      .select('*')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false });

    const orderMap = new Map(ordersData.map((o) => [o.id, o]));
    const combined = (proofsData ?? []).map((p) => {
      const order = orderMap.get(p.order_id);
      return {
        id: p.id,
        file_url: p.file_url,
        declared_amount: p.declared_amount,
        transaction_reference: p.transaction_reference,
        payer_phone: p.payer_phone,
        payment_method: p.payment_method,
        verified: p.verified,
        created_at: p.created_at,
        order_id: p.order_id,
        order_number: order?.order_number ?? '',
        order_total: order?.total ?? 0,
        customer_name: order?.customer_name ?? '',
        customer_phone: order?.customer_phone ?? '',
        payment_status: order?.payment_status ?? '',
        order_status: order?.order_status ?? '',
      };
    });

    // Sort: unverified first
    combined.sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { data: combined, error: null };
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-secondary-900">Preuves de paiement</h1>
        <button onClick={refetch} className="btn-ghost text-sm">Actualiser</button>
      </div>

      {loading ? <Loading /> : proofs && proofs.length > 0 ? (
        <div className="space-y-3">
          {proofs.map((proof) => {
            const amountMismatch = proof.declared_amount && proof.order_total > 0 && Math.abs(proof.declared_amount - proof.order_total) / proof.order_total > 0.2;
            return (
              <Link
                key={proof.id}
                to={`/admin/orders/${proof.order_id}`}
                className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <a
                  href={proof.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-secondary-100 shrink-0 flex items-center justify-center"
                >
                  {proof.file_url.match(/\.(jpg|jpeg|png)$/i) ? (
                    <img src={proof.file_url} alt="Preuve" className="w-full h-full object-cover" />
                  ) : (
                    <FileCheck className="w-8 h-8 text-secondary-400" />
                  )}
                </a>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-secondary-900 text-sm">{proof.order_number}</p>
                    <span className={`badge text-xs ${
                      proof.verified ? 'bg-success-100 text-success-700' :
                      proof.payment_status === 'refused' ? 'bg-error-100 text-error-700' :
                      'bg-warning-100 text-warning-700'
                    }`}>
                      {proof.verified ? 'Vérifiée' : proof.payment_status === 'refused' ? 'Refusée' : 'À vérifier'}
                    </span>
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">
                    {proof.customer_name} • {proof.customer_phone}
                  </p>
                  <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                    <p><span className="text-secondary-400">Attendu:</span> <span className="font-medium text-secondary-700">{formatPrice(proof.order_total)}</span></p>
                    {proof.declared_amount && (
                      <p>
                        <span className="text-secondary-400">Déclaré:</span>{' '}
                        <span className={`font-medium ${amountMismatch ? 'text-error-600' : 'text-secondary-700'}`}>
                          {formatPrice(proof.declared_amount)}
                        </span>
                      </p>
                    )}
                    {proof.transaction_reference && <p><span className="text-secondary-400">Réf:</span> <span className="font-medium">{proof.transaction_reference}</span></p>}
                    {proof.payer_phone && <p><span className="text-secondary-400">Payeur:</span> <span className="font-medium">{proof.payer_phone}</span></p>}
                  </div>
                  <p className="text-xs text-secondary-400 mt-1">{formatDateTime(proof.created_at)}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {amountMismatch && (
                    <span className="badge bg-error-100 text-error-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Montant incohérent
                    </span>
                  )}
                  <ArrowRight className="w-5 h-5 text-secondary-400" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Aucune preuve de paiement" message="Les preuves envoyées par les clients apparaîtront ici." />
      )}
    </div>
  );
}
