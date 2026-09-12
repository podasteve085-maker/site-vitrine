import { useState } from 'react';
import { Boxes, Save, Loader2, AlertTriangle } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Product } from '@/lib/types';
import { Loading, EmptyState } from '@/components/Loading';

export default function AdminStock() {
  const { data: products, loading, refetch } = useFetch<Product[]>(async () => {
    const { data, error } = await supabase.from('products').select('*').eq('restaurant_id', RESTAURANT_ID).eq('is_active', true).order('name');
    return { data: data as Product[] | null, error };
  });

  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const handleSave = async (product: Product) => {
    setSaving(product.id);
    const newStock = parseInt(editing[product.id]);
    if (isNaN(newStock) || newStock < 0) {
      setSaving(null);
      return;
    }
    await supabase.from('products').update({
      stock_quantity: newStock,
      is_available: newStock > 0,
      updated_at: new Date().toISOString(),
    }).eq('id', product.id);
    setEditing((prev) => { const next = { ...prev }; delete next[product.id]; return next; });
    setSaving(null);
    refetch();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-secondary-900 mb-6">Gestion du stock</h1>

      {loading ? <Loading /> : products && products.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-secondary-700">Produit</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-secondary-700 hidden sm:table-cell">Statut</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-secondary-700">Stock actuel</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-secondary-700">Nouveau stock</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50">
              {products.map((product) => {
                const isEditing = editing[product.id] !== undefined;
                const currentVal = isEditing ? editing[product.id] : product.stock_quantity.toString();
                const isLow = product.stock_quantity < 5;
                const isOut = product.stock_quantity === 0;

                return (
                  <tr key={product.id} className="hover:bg-secondary-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url && <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                        <span className="font-medium text-secondary-900 text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {isOut ? (
                        <span className="badge bg-error-100 text-error-700">Rupture</span>
                      ) : isLow ? (
                        <span className="badge bg-warning-100 text-warning-700">Faible</span>
                      ) : (
                        <span className="badge bg-success-100 text-success-700">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${isOut ? 'text-error-600' : isLow ? 'text-warning-600' : 'text-secondary-900'}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        value={currentVal}
                        onChange={(e) => setEditing({ ...editing, [product.id]: e.target.value })}
                        className="w-20 px-2 py-1.5 text-right border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSave(product)}
                        disabled={saving === product.id || !isEditing}
                        className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-40"
                      >
                        {saving === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Aucun produit" message="Ajoutez d'abord des produits pour gérer le stock." icon={Boxes} />
      )}

      {products && products.filter((p) => p.stock_quantity < 5).length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mt-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
          <p className="text-sm text-warning-700">
            {products.filter((p) => p.stock_quantity < 5).length} produit(s) en stock faible ou en rupture. Pensez à réapprovisionner.
          </p>
        </div>
      )}
    </div>
  );
}
