import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Store, Utensils, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import { formatPrice, PAYMENT_METHOD_LABELS } from '@/lib/format';
import type { DeliveryZone, RestaurantSettings, Restaurant } from '@/lib/types';

const ORDER_TYPES = [
  { value: 'pickup', label: 'Retrait sur place', icon: Store },
  { value: 'delivery', label: 'Livraison', icon: Truck },
  { value: 'dine_in', label: 'Sur place', icon: Utensils },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_instructions: '',
    order_type: 'pickup',
    delivery_zone_id: '',
    payment_method: 'orange_money',
  });

  const { data: settings } = useFetch<RestaurantSettings>(async () => {
    const { data, error } = await supabase.from('restaurant_settings').select('*').eq('restaurant_id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const { data: restaurant } = useFetch<Restaurant>(async () => {
    const { data, error } = await supabase.from('restaurants').select('*').eq('id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const { data: zones } = useFetch<DeliveryZone[]>(async () => {
    const { data, error } = await supabase.from('delivery_zones').select('*').eq('restaurant_id', RESTAURANT_ID).eq('is_active', true);
    return { data: data as DeliveryZone[] | null, error };
  });

  const selectedZone = zones?.find((z) => z.id === form.delivery_zone_id);
  const deliveryFee = form.order_type === 'delivery' && selectedZone ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (form.order_type === 'delivery' && !form.delivery_address.trim()) {
        setError('Veuillez saisir votre adresse de livraison.');
        setSubmitting(false);
        return;
      }

      if (form.order_type === 'delivery' && !form.delivery_zone_id) {
        setError('Veuillez sélectionner votre zone de livraison.');
        setSubmitting(false);
        return;
      }

      const itemsJson = items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));

      const { data, error: rpcError } = await supabase.rpc('create_order', {
        p_restaurant_id: RESTAURANT_ID,
        p_customer_name: form.customer_name,
        p_customer_phone: form.customer_phone,
        p_customer_email: form.customer_email || null,
        p_delivery_address: form.order_type === 'delivery' ? form.delivery_address : null,
        p_delivery_instructions: form.delivery_instructions || null,
        p_order_type: form.order_type,
        p_delivery_zone_id: form.order_type === 'delivery' ? form.delivery_zone_id : null,
        p_delivery_fee: deliveryFee,
        p_discount: 0,
        p_payment_method: form.payment_method,
        p_items: itemsJson,
      });

      if (rpcError) throw rpcError;
      if (!data) throw new Error('Aucune réponse du serveur');

      // Update order with payment method
      await supabase
        .from('orders')
        .update({ payment_method: form.payment_method })
        .eq('id', data.order_id);

      clearCart();
      navigate(`/order/${data.order_id}`, { state: { orderNumber: data.order_number } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const availablePaymentMethods = settings?.payment_methods ?? ['orange_money', 'moov_money', 'cash_on_delivery', 'pay_on_arrival'];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-secondary-900 mb-6">Finaliser la commande</h1>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 rounded-xl p-4 mb-6 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order type */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary-900 mb-3">Type de commande</h2>
          <div className="grid grid-cols-3 gap-2">
            {ORDER_TYPES.filter((t) => {
              if (t.value === 'delivery' && !settings?.delivery_enabled) return false;
              if (t.value === 'pickup' && !settings?.pickup_enabled) return false;
              if (t.value === 'dine_in' && !settings?.dine_in_enabled) return false;
              return true;
            }).map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, order_type: type.value })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    form.order_type === type.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium text-center">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-secondary-900">Vos informations</h2>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Nom complet *</label>
            <input
              required
              type="text"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="input-field"
              placeholder="Jean Kaboré"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Téléphone *</label>
            <input
              required
              type="tel"
              value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              className="input-field"
              placeholder="+226 70 00 00 00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Email (facultatif)</label>
            <input
              type="email"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              className="input-field"
              placeholder="jean@email.com"
            />
          </div>
        </div>

        {/* Delivery details */}
        {form.order_type === 'delivery' && (
          <div className="card p-5 space-y-4 animate-slide-up">
            <h2 className="font-semibold text-secondary-900">Adresse de livraison</h2>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Zone de livraison *</label>
              <select
                value={form.delivery_zone_id}
                onChange={(e) => setForm({ ...form, delivery_zone_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Choisir une zone</option>
                {zones?.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — {formatPrice(zone.fee)}
                    {zone.min_order > 0 ? ` (min: ${formatPrice(zone.min_order)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Adresse complète *</label>
              <textarea
                required
                value={form.delivery_address}
                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="Quartier, rue, point de repère..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Instructions (facultatif)</label>
              <input
                type="text"
                value={form.delivery_instructions}
                onChange={(e) => setForm({ ...form, delivery_instructions: e.target.value })}
                className="input-field"
                placeholder="Ex: Appeler en arrivant"
              />
            </div>
          </div>
        )}

        {/* Payment method */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary-900 mb-3">Mode de paiement</h2>
          <div className="space-y-2">
            {availablePaymentMethods.map((method) => (
              <label
                key={method}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  form.payment_method === method
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-secondary-200 hover:border-secondary-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={method}
                  checked={form.payment_method === method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-5 h-5 text-primary-600"
                />
                <span className="font-medium text-secondary-900">
                  {PAYMENT_METHOD_LABELS[method] ?? method}
                </span>
              </label>
            ))}
          </div>

          {/* Payment instructions */}
          {form.payment_method !== 'cash_on_delivery' && form.payment_method !== 'pay_on_arrival' && restaurant && (
            <div className="bg-secondary-50 rounded-xl p-4 mt-4 animate-slide-up">
              <h3 className="font-semibold text-secondary-900 text-sm mb-2">Instructions de paiement</h3>
              <p className="text-sm text-secondary-600">
                Envoyez <span className="font-bold text-primary-600">{formatPrice(total)}</span> au numéro suivant :
              </p>
              <p className="text-lg font-bold text-secondary-900 mt-1">{restaurant.phone}</p>
              <p className="text-xs text-secondary-500 mt-1">Nom: {restaurant.name}</p>
              <p className="text-xs text-secondary-400 mt-2">
                Après le paiement, vous pourrez envoyer votre preuve de paiement sur la page de suivi.
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary-900 mb-3">Récapitulatif</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-secondary-600">
                <span>{item.product.name} × {item.quantity}</span>
                <span>{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-secondary-100 mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-secondary-600 text-sm">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-secondary-600 text-sm">
                <span>Livraison</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold text-secondary-900">Total</span>
              <span className="text-2xl font-bold text-primary-600">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full text-base"
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</>
          ) : (
            <><CheckCircle className="w-5 h-5" /> Confirmer la commande</>
          )}
        </button>
      </form>
    </div>
  );
}
