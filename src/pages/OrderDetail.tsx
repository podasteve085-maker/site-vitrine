import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Clock, Package, ChefHat, Bike, Home, Upload, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS, ORDER_TIMELINE_STEPS } from '@/lib/format';
import type { Order, OrderItem, PaymentProof } from '@/lib/types';

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  new: Clock,
  awaiting_payment: Clock,
  payment_to_verify: AlertCircle,
  payment_confirmed: CheckCircle,
  preparing: ChefHat,
  ready: Package,
  delivering: Bike,
  delivered: Home,
  completed: CheckCircle,
  cancelled: AlertCircle,
  refused: AlertCircle,
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment proof upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [proofForm, setProofForm] = useState({
    declared_amount: '',
    transaction_reference: '',
    payer_phone: '',
  });

  const orderNumber = (location.state as { orderNumber?: string } | null)?.orderNumber;

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('restaurant_id', RESTAURANT_ID)
      .maybeSingle();

    if (orderError || !orderData) {
      setError('Commande introuvable.');
      setLoading(false);
      return;
    }

    setOrder(orderData as Order);

    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);
    setItems((itemsData as OrderItem[]) ?? []);

    const { data: proofsData } = await supabase
      .from('payment_proofs')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false });
    setProofs((proofsData as PaymentProof[]) ?? []);

    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleUploadProof = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order || !id) return;
    setUploadError(null);

    const fileInput = e.currentTarget.elements.namedItem('proof_file') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setUploadError('Veuillez sélectionner un fichier.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Format non supporté. Utilisez JPG, PNG ou PDF.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Le fichier est trop volumineux. Maximum 5 Mo.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `proof-${id}-${Date.now()}.${fileExt}`;
      const filePath = `${RESTAURANT_ID}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Insert proof record
      const { error: insertError } = await supabase.from('payment_proofs').insert({
        order_id: id,
        file_url: urlData.publicUrl,
        declared_amount: proofForm.declared_amount ? parseFloat(proofForm.declared_amount) : null,
        transaction_reference: proofForm.transaction_reference || null,
        payer_phone: proofForm.payer_phone || null,
        payment_method: order.payment_method,
      });

      if (insertError) throw insertError;

      // Update order status to payment_to_verify
      await supabase
        .from('orders')
        .update({ payment_status: 'payment_to_verify', order_status: 'payment_to_verify', updated_at: new Date().toISOString() })
        .eq('id', id);

      // Reload
      await loadOrder();
      setProofForm({ declared_amount: '', transaction_reference: '', payer_phone: '' });
      fileInput.value = '';
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-secondary-400 mt-4 text-sm">Chargement de votre commande...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-secondary-900 mt-4">{error ?? 'Commande introuvable'}</h2>
        <Link to="/track" className="btn-primary mt-6">Suivre une autre commande</Link>
      </div>
    );
  }

  const needsProof = order.payment_method && !['cash_on_delivery', 'pay_on_arrival'].includes(order.payment_method) && order.payment_status !== 'confirmed' && order.payment_status !== 'payment_to_verify';
  const isPaidCash = order.payment_method === 'cash_on_delivery' || order.payment_method === 'pay_on_arrival';

  // Timeline progress
  const currentStepIndex = ORDER_TIMELINE_STEPS.findIndex((s) => s.key === order.order_status);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success-600" />
        </div>
        <h1 className="font-display text-3xl font-bold text-secondary-900">Commande confirmée !</h1>
        <p className="text-secondary-500 mt-2">Votre commande a bien été enregistrée.</p>
        {orderNumber && (
          <p className="text-lg font-bold text-primary-600 mt-2">{orderNumber}</p>
        )}
      </div>

      {/* Timeline */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-secondary-900 mb-4">Suivi de commande</h2>
        <div className="space-y-1">
          {ORDER_TIMELINE_STEPS.map((step, idx) => {
            const isDone = currentStepIndex >= 0 && idx <= currentStepIndex;
            const isCurrent = currentStepIndex >= 0 && idx === currentStepIndex;
            const Icon = STATUS_ICONS[step.key] ?? Clock;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isDone ? 'bg-success-500 text-white' : isCurrent ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-400'
                  }`}>
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  {idx < ORDER_TIMELINE_STEPS.length - 1 && (
                    <div className={`w-0.5 h-6 ${isDone ? 'bg-success-500' : 'bg-secondary-200'}`} />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDone ? 'text-secondary-900' : 'text-secondary-400'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-primary-600">En cours</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-secondary-100">
          <span className={`badge ${
            order.order_status === 'cancelled' || order.order_status === 'refused' ? 'bg-error-100 text-error-700' :
            order.order_status === 'completed' || order.order_status === 'delivered' ? 'bg-success-100 text-success-700' :
            'bg-primary-100 text-primary-700'
          }`}>
            {ORDER_STATUS_LABELS[order.order_status] ?? order.order_status}
          </span>
        </div>
      </div>

      {/* Payment status */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-secondary-900 mb-3">Statut du paiement</h2>
        <div className="flex items-center gap-2">
          <span className={`badge ${
            order.payment_status === 'confirmed' ? 'bg-success-100 text-success-700' :
            order.payment_status === 'refused' ? 'bg-error-100 text-error-700' :
            order.payment_status === 'payment_to_verify' ? 'bg-warning-100 text-warning-700' :
            'bg-secondary-100 text-secondary-700'
          }`}>
            {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
          </span>
          <span className="text-sm text-secondary-500">
            {PAYMENT_METHOD_LABELS[order.payment_method ?? ''] ?? order.payment_method}
          </span>
        </div>

        {order.payment_status === 'payment_to_verify' && (
          <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mt-3">
            <p className="text-sm text-warning-700 font-medium">Paiement en cours de vérification</p>
            <p className="text-xs text-warning-600 mt-1">Le restaurant va vérifier votre paiement. Vous serez notifié une fois confirmé.</p>
          </div>
        )}

        {order.payment_status === 'confirmed' && (
          <div className="bg-success-50 border border-success-200 rounded-xl p-4 mt-3">
            <p className="text-sm text-success-700 font-medium">Paiement confirmé</p>
            <p className="text-xs text-success-600 mt-1">Votre paiement a été vérifié et confirmé par le restaurant.</p>
          </div>
        )}

        {order.payment_status === 'refused' && (
          <div className="bg-error-50 border border-error-200 rounded-xl p-4 mt-3">
            <p className="text-sm text-error-700 font-medium">Paiement refusé</p>
            <p className="text-xs text-error-600 mt-1">Votre preuve de paiement n'a pas pu être vérifiée. Contactez le restaurant.</p>
          </div>
        )}
      </div>

      {/* Upload proof */}
      {needsProof && (
        <div className="card p-6 mb-6 animate-slide-up">
          <h2 className="font-semibold text-secondary-900 mb-2">Envoyer votre preuve de paiement</h2>
          <p className="text-sm text-secondary-500 mb-4">
            Après avoir effectué le paiement via {PAYMENT_METHOD_LABELS[order.payment_method ?? ''] ?? order.payment_method},
            envoyez votre capture d'écran ou votre référence de transaction.
          </p>

          {uploadError && (
            <div className="bg-error-50 border border-error-200 text-error-700 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">{uploadError}</p>
            </div>
          )}

          <form onSubmit={handleUploadProof} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Capture d'écran / Preuve *</label>
              <div className="relative">
                <input
                  name="proof_file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  className="hidden"
                  id="proof-file"
                  onChange={() => setUploadError(null)}
                />
                <label
                  htmlFor="proof-file"
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-secondary-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
                >
                  <Upload className="w-8 h-8 text-secondary-400" />
                  <span className="text-sm text-secondary-500">Cliquez pour sélectionner un fichier</span>
                  <span className="text-xs text-secondary-400">JPG, PNG ou PDF — 5 Mo max</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Montant payé (FCFA)</label>
                <input
                  type="number"
                  value={proofForm.declared_amount}
                  onChange={(e) => setProofForm({ ...proofForm, declared_amount: e.target.value })}
                  className="input-field"
                  placeholder={String(order.total)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">N° de téléphone utilisé</label>
                <input
                  type="tel"
                  value={proofForm.payer_phone}
                  onChange={(e) => setProofForm({ ...proofForm, payer_phone: e.target.value })}
                  className="input-field"
                  placeholder="+226..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Référence de transaction</label>
              <input
                type="text"
                value={proofForm.transaction_reference}
                onChange={(e) => setProofForm({ ...proofForm, transaction_reference: e.target.value })}
                className="input-field"
                placeholder="Ex: TRX12345678"
              />
            </div>

            <button type="submit" disabled={uploading} className="btn-primary w-full">
              {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi...</> : <><Upload className="w-5 h-5" /> Envoyer ma preuve</>}
            </button>
          </form>
        </div>
      )}

      {/* Existing proofs */}
      {proofs.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-secondary-900 mb-3">Preuves envoyées</h2>
          <div className="space-y-3">
            {proofs.map((proof) => (
              <div key={proof.id} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                <div className="w-12 h-12 bg-secondary-200 rounded-lg flex items-center justify-center shrink-0">
                  {proof.file_url.match(/\.(jpg|jpeg|png)$/i) ? (
                    <img src={proof.file_url} alt="Preuve" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Upload className="w-5 h-5 text-secondary-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900">
                    {proof.declared_amount ? formatPrice(proof.declared_amount) : 'Montant non déclaré'}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {proof.transaction_reference ? `Réf: ${proof.transaction_reference}` : 'Pas de référence'} • {formatDateTime(proof.created_at)}
                  </p>
                </div>
                <span className={`badge ${proof.verified ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                  {proof.verified ? 'Vérifiée' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order details */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-secondary-900 mb-3">Détails de la commande</h2>
        <div className="space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-secondary-600">
              <span>{item.product_name} × {item.quantity}</span>
              <span>{formatPrice(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-secondary-100 mt-3 pt-3 space-y-1">
          <div className="flex justify-between text-secondary-600 text-sm">
            <span>Sous-total</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div className="flex justify-between text-secondary-600 text-sm">
              <span>Livraison</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-secondary-900">Total</span>
            <span className="text-xl font-bold text-primary-600">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-secondary-900 mb-3">Informations</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-secondary-500">Nom</dt>
            <dd className="text-secondary-900 font-medium">{order.customer_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-secondary-500">Téléphone</dt>
            <dd className="text-secondary-900 font-medium">{order.customer_phone}</dd>
          </div>
          {order.delivery_address && (
            <div className="flex justify-between">
              <dt className="text-secondary-500">Adresse</dt>
              <dd className="text-secondary-900 font-medium text-right">{order.delivery_address}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-secondary-500">Date</dt>
            <dd className="text-secondary-900 font-medium">{formatDateTime(order.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-3">
        <Link to="/menu" className="btn-secondary flex-1 justify-center">
          Commander encore
        </Link>
        <Link to="/track" className="btn-primary flex-1 justify-center">
          Suivre <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
