import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Package } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import type { Order } from '@/lib/types';

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setSearching(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('order_number', orderNumber.trim().toUpperCase())
        .eq('restaurant_id', RESTAURANT_ID)
        .maybeSingle();

      if (queryError || !data) {
        setError('Aucune commande trouvée avec ce numéro. Vérifiez et réessayez.');
        setSearching(false);
        return;
      }

      const order = data as Pick<Order, 'id' | 'order_number'>;
      navigate(`/order/${order.id}`, { state: { orderNumber: order.order_number } });
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setSearching(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="font-display text-3xl font-bold text-secondary-900">Suivre ma commande</h1>
        <p className="text-secondary-500 mt-2">Entrez votre numéro de commande pour voir son statut.</p>
      </div>

      <form onSubmit={handleSearch} className="card p-6">
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="input-field pl-10"
            placeholder="Ex: CMD-20260912-000001"
          />
        </div>
        <button type="submit" disabled={searching || !orderNumber.trim()} className="btn-primary w-full mt-4">
          {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Suivre ma commande
        </button>
      </form>

      <p className="text-xs text-secondary-400 text-center mt-4">
        Vous trouverez votre numéro de commande sur votre confirmation de commande.
      </p>
    </div>
  );
}
