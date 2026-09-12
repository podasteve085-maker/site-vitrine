import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, FolderTree } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Category } from '@/lib/types';
import { Loading, EmptyState } from '@/components/Loading';

export default function AdminCategories() {
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories, loading, refetch } = useFetch<Category[]>(async () => {
    const { data, error } = await supabase.from('categories').select('*').eq('restaurant_id', RESTAURANT_ID).order('sort_order');
    return { data: data as Category[] | null, error };
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ? Les produits de cette catégorie ne seront pas supprimés.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { alert('Erreur: ' + error.message); return; }
    refetch();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-secondary-900">Catégories</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-5 h-5" /> Ajouter
        </button>
      </div>

      {loading ? <Loading /> : categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="card p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <FolderTree className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-secondary-900">{cat.name}</h3>
                <p className="text-xs text-secondary-500">{cat.description ?? 'Pas de description'}</p>
                {!cat.is_active && <span className="badge bg-secondary-100 text-secondary-600 mt-1">Inactive</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(cat); setShowForm(true); }} className="p-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 bg-error-50 text-error-600 rounded-lg hover:bg-error-100 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune catégorie" message="Ajoutez des catégories pour organiser votre menu." />
      )}

      {showForm && (
        <CategoryForm category={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); refetch(); }} saving={saving} setSaving={setSaving} error={error} setError={setError} />
      )}
    </div>
  );
}

function CategoryForm({ category, onClose, onSaved, saving, setSaving, error, setError }: {
  category: Category | null; onClose: () => void; onSaved: () => void;
  saving: boolean; setSaving: (v: boolean) => void; error: string | null; setError: (v: string | null) => void;
}) {
  const [form, setForm] = useState({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    sort_order: category?.sort_order?.toString() ?? '0',
    is_active: category?.is_active ?? true,
  });

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const payload = {
        restaurant_id: RESTAURANT_ID,
        name: form.name,
        slug,
        description: form.description || null,
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };
      if (category) {
        const { error } = await supabase.from('categories').update(payload).eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  }, [form, category, onSaved, setSaving, setError]);

  return (
    <div className="fixed inset-0 bg-secondary-950/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-secondary-100">
          <h2 className="font-display text-xl font-bold text-secondary-900">{category ? 'Modifier' : 'Nouvelle catégorie'}</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-secondary-400" /></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && <div className="bg-error-50 border border-error-200 text-error-700 rounded-xl p-3 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Nom *</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Grillades" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Viandes grillées au feu de bois" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Ordre d'affichage</label>
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="input-field" placeholder="1" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
            <span className="text-sm text-secondary-700">Active</span>
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {category ? 'Enregistrer' : 'Créer'}
          </button>
        </form>
      </div>
    </div>
  );
}
