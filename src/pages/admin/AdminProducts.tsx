import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Search, Package } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import { formatPrice } from '@/lib/format';
import type { Product, Category } from '@/lib/types';
import { Loading, EmptyState } from '@/components/Loading';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: products, loading, refetch } = useFetch<Product[]>(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('created_at', { ascending: false });
    return { data: data as Product[] | null, error };
  });

  const { data: categories } = useFetch<Category[]>(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('is_active', true)
      .order('sort_order');
    return { data: data as Category[] | null, error };
  });

  const filtered = products?.filter((p) =>
    search.trim() === '' ? true : p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ? Cette action est irréversible.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }
    refetch();
  };

  const handleToggleActive = async (product: Product) => {
    await supabase.from('products').update({ is_active: !product.is_active, updated_at: new Date().toISOString() }).eq('id', product.id);
    refetch();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-secondary-900">Produits</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" /> Ajouter un produit
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <Loading />
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-secondary-100">
                {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                {!product.is_active && (
                  <div className="absolute inset-0 bg-secondary-950/50 flex items-center justify-center">
                    <span className="badge bg-secondary-700 text-white">Inactif</span>
                  </div>
                )}
                {!product.is_available && product.is_active && (
                  <div className="absolute top-2 right-2">
                    <span className="badge bg-error-500 text-white">Rupture</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-secondary-900">{product.name}</h3>
                <p className="text-sm text-secondary-500 line-clamp-1 mt-0.5">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="font-bold text-primary-600">{formatPrice(product.price)}</span>
                    {product.old_price && (
                      <span className="text-xs text-secondary-400 line-through ml-1">{formatPrice(product.old_price)}</span>
                    )}
                  </div>
                  <span className="text-xs text-secondary-500">Stock: {product.stock_quantity}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => { setEditing(product); setShowForm(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg text-sm font-medium hover:bg-secondary-200 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Modifier
                  </button>
                  <button
                    onClick={() => handleToggleActive(product)}
                    className="px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg text-sm hover:bg-secondary-200 transition-colors"
                  >
                    {product.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-error-50 text-error-600 rounded-lg hover:bg-error-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucun produit" message="Ajoutez votre premier produit pour commencer." />
      )}

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories ?? []}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); }}
          saving={saving}
          setSaving={setSaving}
          error={error}
          setError={setError}
        />
      )}
    </div>
  );
}

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}

function ProductForm({ product, categories, onClose, onSaved, saving, setSaving, error, setError }: ProductFormProps) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    old_price: product?.old_price?.toString() ?? '',
    image_url: product?.image_url ?? '',
    category_id: product?.category_id ?? '',
    stock_quantity: product?.stock_quantity?.toString() ?? '0',
    prep_time_minutes: product?.prep_time_minutes?.toString() ?? '15',
    is_popular: product?.is_popular ?? false,
    is_active: product?.is_active ?? true,
  });

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        restaurant_id: RESTAURANT_ID,
        category_id: form.category_id || null,
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        old_price: form.old_price ? parseFloat(form.old_price) : null,
        image_url: form.image_url || null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        is_available: (parseInt(form.stock_quantity) || 0) > 0,
        prep_time_minutes: parseInt(form.prep_time_minutes) || 15,
        is_popular: form.is_popular,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [form, product, onSaved, setSaving, setError]);

  return (
    <div className="fixed inset-0 bg-secondary-950/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-secondary-100 sticky top-0 bg-white z-10">
          <h2 className="font-display text-xl font-bold text-secondary-900">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && <div className="bg-error-50 border border-error-200 text-error-700 rounded-xl p-3 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Nom *</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Poulet braisé" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} placeholder="Demi-poulet mariné, grillé au feu de bois..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Prix (FCFA) *</label>
              <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" placeholder="3500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Ancien prix (optionnel)</label>
              <input type="number" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} className="input-field" placeholder="4000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Catégorie</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field">
              <option value="">Aucune</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">URL de l'image</label>
            <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://..." />
            {form.image_url && <img src={form.image_url} alt="Aperçu" className="w-full h-32 object-cover rounded-xl mt-2" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Stock *</label>
              <input required type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="input-field" placeholder="20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Temps de prép. (min)</label>
              <input type="number" value={form.prep_time_minutes} onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })} className="input-field" placeholder="15" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
              <span className="text-sm text-secondary-700">Plat populaire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
              <span className="text-sm text-secondary-700">Actif</span>
            </label>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {product ? 'Enregistrer' : 'Créer le produit'}
          </button>
        </form>
      </div>
    </div>
  );
}
