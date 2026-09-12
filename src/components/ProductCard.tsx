import { Plus, Clock, Flame } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const outOfStock = !product.is_available || product.stock_quantity <= 0;

  return (
    <div className="card overflow-hidden group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary-400">
            <Flame className="w-12 h-12" />
          </div>
        )}
        {product.old_price && (
          <span className="absolute top-2 left-2 badge bg-error-500 text-white">
            Promo
          </span>
        )}
        {product.is_popular && (
          <span className="absolute top-2 right-2 badge bg-primary-600 text-white">
            Populaire
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-secondary-950/60 flex items-center justify-center">
            <span className="badge bg-error-500 text-white text-sm px-3 py-1">Rupture de stock</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-secondary-900 text-base leading-snug">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-secondary-500 mt-1 line-clamp-2 flex-1">{product.description}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-secondary-400 mt-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{product.prep_time_minutes} min</span>
          {!outOfStock && (
            <span className="ml-2 text-secondary-400">Stock: {product.stock_quantity}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-primary-600 text-lg">{formatPrice(product.price)}</span>
            {product.old_price && (
              <span className="text-sm text-secondary-400 line-through">{formatPrice(product.old_price)}</span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            disabled={outOfStock}
            className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Ajouter ${product.name} au panier`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
