import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle, Image as ImageIcon, Clock } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/format';
import type { Order, OrderItem, PaymentProof } from '@/lib/types';

const ORDER_STATUSES = ['new', 'preparing', 'ready', 'delivering', 'delivered', 'completed', 'cancelled', 'refused'];

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error: queryError } = await supabase.from('orders').select('*').eq('id', id).eq('restaurant_id', RESTAURANT_ID).maybeSingle();
    if (queryError || !data) { setError('Commande introuvable.'); setLoading(false); return; }
    setOrder(data as Order);
    const { data: itemsData } = await supabase.from('order_items').select('*').eq('order_id', id);
    setItems((itemsData as OrderItem[]) ?? []);
    const { data: proofsData } = await supabase.from('payment_proofs').select('*').eq('order_id', id).order('created_at', { ascending: false });
    setProofs((proofsData as PaymentProof[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  const handlePaymentAction = async (action: 'confirm' | 'refuse') => {
    if (!order || !profile) return;
    if (action === 'refuse' && !confirm('Refuser ce paiement ?')) return;
    setActionLoading(true);
    const { error: rpcError } = await supabase.rpc('verify_payment', {
      p_order_id: order.id,
      p_action: action,
      p_admin_user_id: profile.user_id,
      p_admin_name: profile.full_name,
      p_restaurant_id: RESTAURANT_ID,
    });
    if (rpcError) { alert('Erreur: ' + rpcError.message); setActionLoading(false); return; }
    await loadOrder();
    setActionLoading(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order || !profile) return;
    setActionLoading(true);
    const { error: rpcError } = await supabase.rpc('update_order_status', {
      p_order_id: order.id,
      p_new_status: newStatus,
      p_admin_user_id: profile.user_id,
      p_admin_name: profile.full_name,
      p_restaurant_id: RESTAURANT_ID,
    });
    if (rpcError) { alert('Erreur: ' + rpcError.message); setActionLoading(false); return; }
    await loadOrder();
    setActionLoading(false);
  };

  // Fraud detection
  const riskFlags: string[] = [];
  if (order && proofs.length > 0) {
    proofs.forEach((proof) => {
      if (proof.declared_amount && order.total > 0) {
        const ratio = proof.declared_amount / order.total;
        if (ratio < 0.8 || ratio > 1.2) {
          riskFlags.push(`Montant incohérent: déclaré ${formatPrice(proof.declared_amount)} vs attendu ${formatPrice(order.total)}`);
        }
      }
    });
    // Check for duplicate references
    proofs.forEach((proof) => {
      if (proof.transaction_reference) {
        // This would need a query to check other orders - simplified for now
      }
    });
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto" />
        <h2 className="font-display text-xl font-bold text-secondary-900 mt-4">{error ?? 'Commande introuvable'}</h2>
        <Link to="/admin/orders" className="btn-primary mt-4">Retour aux commandes</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link to="/admin/orders" className="flex items-center gap-2 text-sm text-secondary-500 hover:text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour aux commandes
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary-900">{order.order_number}</h1>
          <p className="text-sm text-secondary-500">{formatDateTime(order.created_at)}</p>
        </div>
        <span className={`badge text-sm ${order.order_status === 'cancelled' || order.order_status === 'refused' ? 'bg-error-100 text-error-700' : order.order_status === 'completed' || order.order_status === 'delivered' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'}`}>
          {ORDER_STATUS_LABELS[order.order_status] ?? order.order_status}
        </span>
      </div>

      {/* Customer info */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-secondary-900 mb-3">Client</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-secondary-500">Nom</dt><dd className="text-secondary-900 font-medium">{order.customer_name}</dd></div>
          <div><dt className="text-secondary-500">Téléphone</dt><dd className="text-secondary-900 font-medium">{order.customer_phone}</dd></div>
          {order.customer_email && <div><dt className="text-secondary-500">Email</dt><dd className="text-secondary-900 font-medium">{order.customer_email}</dd></div>}
          <div><dt className="text-secondary-500">Type</dt><dd className="text-secondary-900 font-medium capitalize">{order.order_type === 'pickup' ? 'Retrait' : order.order_type === 'delivery' ? 'Livraison' : 'Sur place'}</dd></div>
          {order.delivery_address && <div className="col-span-2"><dt className="text-secondary-500">Adresse</dt><dd className="text-secondary-900 font-medium">{order.delivery_address}</dd></div>}
          {order.delivery_instructions && <div className="col-span-2"><dt className="text-secondary-500">Instructions</dt><dd className="text-secondary-900 font-medium">{order.delivery_instructions}</dd></div>}
        </dl>
      </div>

      {/* Items */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-secondary-900 mb-3">Articles</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span className="text-secondary-700">{item.product_name} × {item.quantity}</span>
              <span className="font-medium text-secondary-900">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-secondary-100 mt-3 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-secondary-600"><span>Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.delivery_fee > 0 && <div className="flex justify-between text-sm text-secondary-600"><span>Livraison</span><span>{formatPrice(order.delivery_fee)}</span></div>}
          {order.discount > 0 && <div className="flex justify-between text-sm text-secondary-600"><span>Remise</span><span>-{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between items-center pt-2"><span className="font-semibold text-secondary-900">Total</span><span className="text-xl font-bold text-primary-600">{formatPrice(order.total)}</span></div>
        </div>
      </div>

      {/* Payment */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-secondary-900 mb-3">Paiement</h2>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-secondary-600">Méthode:</span>
          <span className="text-sm font-medium text-secondary-900">{PAYMENT_METHOD_LABELS[order.payment_method ?? ''] ?? order.payment_method}</span>
          <span className={`badge ml-auto ${order.payment_status === 'confirmed' ? 'bg-success-100 text-success-700' : order.payment_status === 'refused' ? 'bg-error-100 text-error-700' : order.payment_status === 'payment_to_verify' ? 'bg-warning-100 text-warning-700' : 'bg-secondary-100 text-secondary-700'}`}>
            {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
          </span>
        </div>

        {/* Payment proofs */}
        {proofs.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="text-sm font-semibold text-secondary-700">Preuves de paiement</h3>
            {proofs.map((proof) => (
              <div key={proof.id} className="bg-secondary-50 rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <a href={proof.file_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden bg-secondary-200 shrink-0 flex items-center justify-center">
                    {proof.file_url.match(/\.(jpg|jpeg|png)$/i) ? (
                      <img src={proof.file_url} alt="Preuve" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-secondary-400" />
                    )}
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {proof.declared_amount && <p><span className="text-secondary-500">Montant:</span> <span className="font-medium">{formatPrice(proof.declared_amount)}</span></p>}
                      {proof.transaction_reference && <p><span className="text-secondary-500">Réf:</span> <span className="font-medium">{proof.transaction_reference}</span></p>}
                      {proof.payer_phone && <p><span className="text-secondary-500">N° payeur:</span> <span className="font-medium">{proof.payer_phone}</span></p>}
                      <p><span className="text-secondary-500">Date:</span> <span className="font-medium">{formatDateTime(proof.created_at)}</span></p>
                    </div>
                    <span className={`badge mt-2 ${proof.verified ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                      {proof.verified ? 'Vérifiée' : 'En attente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fraud alerts */}
        {riskFlags.length > 0 && (
          <div className="bg-error-50 border border-error-200 rounded-xl p-4 mt-4">
            <p className="text-sm font-semibold text-error-700 mb-2">Alertes de sécurité</p>
            {riskFlags.map((flag, i) => (
              <p key={i} className="text-xs text-error-600 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {flag}
              </p>
            ))}
          </div>
        )}

        {/* Actions */}
        {order.payment_status === 'payment_to_verify' && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => handlePaymentAction('confirm')} disabled={actionLoading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-success-600 text-white font-semibold rounded-xl hover:bg-success-700 active:scale-95 transition-all disabled:opacity-50">
              <CheckCircle className="w-5 h-5" /> Confirmer
            </button>
            <button onClick={() => handlePaymentAction('refuse')} disabled={actionLoading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-error-600 text-white font-semibold rounded-xl hover:bg-error-700 active:scale-95 transition-all disabled:opacity-50">
              <XCircle className="w-5 h-5" /> Refuser
            </button>
          </div>
        )}
      </div>

      {/* Status update */}
      <div className="card p-5">
        <h2 className="font-semibold text-secondary-900 mb-3">Modifier le statut</h2>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusUpdate(status)}
              disabled={actionLoading || order.order_status === status}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                order.order_status === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {ORDER_STATUS_LABELS[status] ?? status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
