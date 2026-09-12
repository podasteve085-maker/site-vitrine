import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Promotion } from '@/lib/types';
import { Loading, EmptyState } from '@/components/Loading';

export default function AdminPromotions() {
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: promotions, loading, refetch } = useFetch<Promotion[]>(async () => {
    const { data, error } = await supabase.from('promotions').select('*').eq('restaurant_id', RESTAURANT_ID).order('created_at', { ascending: false });
    return { data: data as Promotion[] | null, error };
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette promotion ?')) return;
    await supabase.from('promotions').delete().eq('id', id);
    refetch();
  };

  const handleToggle = async (promo: Promotion) => {
    await supabase.from('promotions').update({ is_active: !promo.is_active }).eq('id', promo.id);
    refetch();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-secondary-900">Promotions</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-5 h-5" /> Ajouter
        </button>
      </div>

      {loading ? <Loading /> : promotions && promotions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {promotions.map((promo) => (
            <div key={promo.id} className={`card p-5 ${!promo.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                  <Tag className="w-6 h-6 text-primary-600" />
                </div>
                <button onClick={() => handleToggle(promo)} className="text-secondary-400 hover:text-primary-600">
                  {promo.is_active ? <ToggleRight className="w-6 h-6 text-success-500" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
              <h3 className="font-semibold text-secondary-900 mt-3">{promo.title}</h3>
              <p className="text-sm text-secondary-500 mt-1">{promo.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="badge bg-primary-100 text-primary-700">
                  {promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : promo.discount_type === 'buy_one_get_one' ? '1 acheté = 1 offert' : 'Offre spéciale'}
                </span>
                {promo.end_date && <span className="text-xs text-secondary-400">Jusqu'au {new Date(promo.end_date).toLocaleDateString('fr-FR')}</span>}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setEditing(promo); setShowForm(true); }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg text-sm hover:bg-secondary-200 transition-colors">
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
                <button onClick={() => handleDelete(promo.id)} className="p-2 bg-error-50 text-error-600 rounded-lg hover:bg-error-100 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune promotion" message="Créez des promotions pour attirer plus de clients." />
      )}

      {showForm && (
        <PromoForm promo={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); refetch(); }} saving={saving} setSaving={setSaving} error={error} setError={setError} />
      )}
    </div>
  );
}

function PromoForm({ promo, onClose, onSaved, saving, setSaving, error, setError }: {
  promo: Promotion | null; onClose: () => void; onSaved: () => void;
  saving: boolean; setSaving: (v: boolean) => void; error: string | null; setError: (v: string | null) => void;
}) {
  const [form, setForm] = useState({
    title: promo?.title ?? '',
    description: promo?.description ?? '',
    discount_type: promo?.discount_type ?? 'percentage',
    discount_value: promo?.discount_value?.toString() ?? '10',
    is_active: promo?.is_active ?? true,
    end_date: promo?.end_date ? new Date(promo.end_date).toISOString().split('T')[0] : '',
  });

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        restaurant_id: RESTAURANT_ID,
        title: form.title,
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value) || 0,
        is_active: form.is_active,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      };
      if (promo) {
        const { error } = await supabase.from('promotions').update(payload).eq('id', promo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('promotions').insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  }, [form, promo, onSaved, setSaving, setError]);

  return (
    <div className="fixed inset-0 bg-secondary-950/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-secondary-100">
          <h2 className="font-display text-xl font-bold text-secondary-900">{promo ? 'Modifier' : 'Nouvelle promotion'}</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-secondary-400" /></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && <div className="bg-error-50 border border-error-200 text-error-700 rounded-xl p-3 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Titre *</label>
            <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Menu famille -20%" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="20% de réduction sur..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Type</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="input-field">
                <option value="percentage">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
                <option value="buy_one_get_one">1 acheté = 1 offert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Valeur</label>
              <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="input-field" placeholder="20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Date de fin (optionnel)</label>
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
            <span className="text-sm text-secondary-700">Active</span>
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {promo ? 'Enregistrer' : 'Créer'}
          </button>
        </form>
      </div>
    </div>
  );
}
