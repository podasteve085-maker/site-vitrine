import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { EmptyState } from '@/components/Loading';

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          title="Votre panier est vide"
          message="Parcourez notre menu et ajoutez vos plats préférés."
        />
        <div className="text-center mt-6">
          <Link to="/menu" className="btn-primary">
            <ShoppingBag className="w-5 h-5" /> Voir le menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
    <h1 className="font-display text-3xl font-bold text-secondary-900 mb-6">Votre panier</h1>

    <div className="space-y-3">
    {items.map((item) => {
      const maxQty = item.product.stock_quantity;
      return (
        <div key={item.product.id} className="card p-4 flex gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary-100 shrink-0">
            {item.product.image_url && (
              <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-secondary-900 truncate">{item.product.name}</h3>
              <button onClick={() => removeItem(item.product.id)} className="text-secondary-400 hover:text-error-500 transition-colors shrink-0">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-primary-600 font-semibold mt-0.5">{formatPrice(item.product.price)}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center hover:bg-secondary-200 active:scale-90 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-semibold text-secondary-900 w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= maxQty}
                  className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center hover:bg-secondary-200 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {item.quantity >= maxQty && (
                  <span className="text-xs text-secondary-400 ml-1">Stock max</span>
                )}
              </div>
              <span className="font-bold text-secondary-900">{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          </div>
        </div>
      );
    })}
    </div>

    <button onClick={clearCart} className="text-sm text-secondary-400 hover:text-error-500 transition-colors mt-4">
      Vider le panier
    </button>

    {/* Summary */}
    <div className="card p-6 mt-6">
      <div className="flex justify-between text-secondary-600">
        <span>Sous-total</span>
        <span className="font-semibold">{formatPrice(subtotal)}</span>
      </div>
      <div className="border-t border-secondary-100 mt-4 pt-4 flex justify-between items-center">
        <span className="text-lg font-semibold text-secondary-900">Total</span>
        <span className="text-2xl font-bold text-primary-600">{formatPrice(subtotal)}</span>
      </div>
      <p className="text-xs text-secondary-400 mt-2">Les frais de livraison seront calculés à l'étape suivante.</p>
      <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-4">
        Passer la commande <ArrowRight className="w-5 h-5" />
      </button>
      <Link to="/menu" className="btn-ghost w-full mt-2 justify-center">
        Continuer mes achats
      </Link>
    </div>
    </div>
  );
}
