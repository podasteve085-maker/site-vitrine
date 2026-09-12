import { useState, useEffect } from 'react';
import { Save, Loader2, Store, Clock, CreditCard, Truck, MessageCircle, CheckCircle } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Restaurant, RestaurantSettings, DeliveryZone } from '@/lib/types';
import { PAYMENT_METHOD_LABELS } from '@/lib/format';

const DAY_NAMES = [
  { key: 'mon', label: 'Lundi' },
  { key: 'tue', label: 'Mardi' },
  { key: 'wed', label: 'Mercredi' },
  { key: 'thu', label: 'Jeudi' },
  { key: 'fri', label: 'Vendredi' },
  { key: 'sat', label: 'Samedi' },
  { key: 'sun', label: 'Dimanche' },
];

const ALL_PAYMENT_METHODS = ['orange_money', 'moov_money', 'mtn_money', 'cash_on_delivery', 'pay_on_arrival'];

export default function AdminSettings() {
  const { data: restaurant, refetch: refetchRestaurant } = useFetch<Restaurant>(async () => {
    const { data, error } = await supabase.from('restaurants').select('*').eq('id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const { data: settings, refetch: refetchSettings } = useFetch<RestaurantSettings>(async () => {
    const { data, error } = await supabase.from('restaurant_settings').select('*').eq('restaurant_id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const { data: zones, refetch: refetchZones } = useFetch<DeliveryZone[]>(async () => {
    const { data, error } = await supabase.from('delivery_zones').select('*').eq('restaurant_id', RESTAURANT_ID).order('created_at');
    return { data: data as DeliveryZone[] | null, error };
  });

  const [tab, setTab] = useState<'restaurant' | 'hours' | 'payment' | 'delivery'>('restaurant');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restaurant form
  const [restForm, setRestForm] = useState<Partial<Restaurant>>({});
  useEffect(() => { if (restaurant) setRestForm(restaurant); }, [restaurant]);

  // Settings form
  const [setForm, setSetForm] = useState<Partial<RestaurantSettings>>({});
  useEffect(() => { if (settings) setSetForm(settings); }, [settings]);

  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { error } = await supabase.from('restaurants').update({
        name: restForm.name,
        description: restForm.description,
        phone: restForm.phone,
        whatsapp: restForm.whatsapp,
        email: restForm.email,
        address: restForm.address,
        city: restForm.city,
        country: restForm.country,
        slogan: restForm.slogan,
        story: restForm.story,
        instagram: restForm.instagram,
        facebook: restForm.facebook,
        tiktok: restForm.tiktok,
        gps_lat: restForm.gps_lat ? parseFloat(String(restForm.gps_lat)) : null,
        gps_lng: restForm.gps_lng ? parseFloat(String(restForm.gps_lng)) : null,
        hero_image_url: restForm.hero_image_url,
        updated_at: new Date().toISOString(),
      }).eq('id', RESTAURANT_ID);
      if (error) throw error;
      setSaved(true);
      refetchRestaurant();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { error } = await supabase.from('restaurant_settings').update({
        opening_hours: setForm.opening_hours,
        delivery_enabled: setForm.delivery_enabled,
        pickup_enabled: setForm.pickup_enabled,
        dine_in_enabled: setForm.dine_in_enabled,
        min_order_amount: setForm.min_order_amount,
        payment_methods: setForm.payment_methods,
        whatsapp_message: setForm.whatsapp_message,
        updated_at: new Date().toISOString(),
      }).eq('restaurant_id', RESTAURANT_ID);
      if (error) throw error;
      setSaved(true);
      refetchSettings();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method: string) => {
    const current = setForm.payment_methods ?? [];
    const updated = current.includes(method) ? current.filter((m) => m !== method) : [...current, method];
    setSetForm({ ...setForm, payment_methods: updated });
  };

  const updateHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    const hours = { ...(setForm.opening_hours ?? {}) };
    hours[day] = { ...hours[day], [field]: value };
    setSetForm({ ...setForm, opening_hours: hours });
  };

  const tabs = [
    { value: 'restaurant' as const, label: 'Restaurant', icon: Store },
    { value: 'hours' as const, label: 'Horaires', icon: Clock },
    { value: 'payment' as const, label: 'Paiement', icon: CreditCard },
    { value: 'delivery' as const, label: 'Livraison', icon: Truck },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-secondary-900 mb-6">Paramètres</h1>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.value ? 'bg-primary-600 text-white' : 'bg-white text-secondary-700 hover:bg-secondary-100'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 rounded-xl p-3 mb-4 text-sm">{error}</div>
      )}
      {saved && (
        <div className="bg-success-50 border border-success-200 text-success-700 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" /> Modifications enregistrées avec succès.
        </div>
      )}

      {/* Restaurant tab */}
      {tab === 'restaurant' && (
        <form onSubmit={handleSaveRestaurant} className="card p-6 space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Nom du restaurant *</label>
              <input required type="text" value={restForm.name ?? ''} onChange={(e) => setRestForm({ ...restForm, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Slogan</label>
              <input type="text" value={restForm.slogan ?? ''} onChange={(e) => setRestForm({ ...restForm, slogan: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
            <textarea value={restForm.description ?? ''} onChange={(e) => setRestForm({ ...restForm, description: e.target.value })} className="input-field" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Histoire / À propos</label>
            <textarea value={restForm.story ?? ''} onChange={(e) => setRestForm({ ...restForm, story: e.target.value })} className="input-field" rows={4} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Téléphone</label>
              <input type="tel" value={restForm.phone ?? ''} onChange={(e) => setRestForm({ ...restForm, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">WhatsApp</label>
              <input type="tel" value={restForm.whatsapp ?? ''} onChange={(e) => setRestForm({ ...restForm, whatsapp: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
            <input type="email" value={restForm.email ?? ''} onChange={(e) => setRestForm({ ...restForm, email: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Adresse</label>
              <input type="text" value={restForm.address ?? ''} onChange={(e) => setRestForm({ ...restForm, address: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Ville</label>
              <input type="text" value={restForm.city ?? ''} onChange={(e) => setRestForm({ ...restForm, city: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Instagram</label>
              <input type="url" value={restForm.instagram ?? ''} onChange={(e) => setRestForm({ ...restForm, instagram: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Facebook</label>
              <input type="url" value={restForm.facebook ?? ''} onChange={(e) => setRestForm({ ...restForm, facebook: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">GPS Latitude</label>
              <input type="number" step="any" value={restForm.gps_lat ?? ''} onChange={(e) => setRestForm({ ...restForm, gps_lat: parseFloat(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">GPS Longitude</label>
              <input type="number" step="any" value={restForm.gps_lng ?? ''} onChange={(e) => setRestForm({ ...restForm, gps_lng: parseFloat(e.target.value) })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">URL image héro</label>
            <input type="url" value={restForm.hero_image_url ?? ''} onChange={(e) => setRestForm({ ...restForm, hero_image_url: e.target.value })} className="input-field" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Enregistrer
          </button>
        </form>
      )}

      {/* Hours tab */}
      {tab === 'hours' && (
        <div className="card p-6 max-w-2xl space-y-4">
          {DAY_NAMES.map((day) => {
            const dayHours = setForm.opening_hours?.[day.key];
            return (
              <div key={day.key} className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b border-secondary-50 last:border-0">
                <span className="font-medium text-secondary-900 w-28 shrink-0">{day.label}</span>
                <label className="flex items-center gap-2 text-sm text-secondary-600">
                  <input
                    type="checkbox"
                    checked={!(dayHours?.closed)}
                    onChange={(e) => updateHours(day.key, 'closed', !e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  Ouvert
                </label>
                {!(dayHours?.closed) && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={dayHours?.open ?? '08:00'}
                      onChange={(e) => updateHours(day.key, 'open', e.target.value)}
                      className="px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-secondary-400">→</span>
                    <input
                      type="time"
                      value={dayHours?.close ?? '22:00'}
                      onChange={(e) => updateHours(day.key, 'close', e.target.value)}
                      className="px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Message WhatsApp par défaut</label>
            <input type="text" value={setForm.whatsapp_message ?? ''} onChange={(e) => setSetForm({ ...setForm, whatsapp_message: e.target.value })} className="input-field" />
          </div>
          <button onClick={handleSaveSettings} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Enregistrer les horaires
          </button>
        </div>
      )}

      {/* Payment tab */}
      {tab === 'payment' && (
        <div className="card p-6 max-w-2xl space-y-4">
          <h2 className="font-semibold text-secondary-900">Modes de paiement acceptés</h2>
          <div className="space-y-2">
            {ALL_PAYMENT_METHODS.map((method) => {
              const enabled = setForm.payment_methods?.includes(method) ?? false;
              return (
                <label key={method} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${enabled ? 'border-primary-600 bg-primary-50' : 'border-secondary-200'}`}>
                  <input type="checkbox" checked={enabled} onChange={() => togglePaymentMethod(method)} className="w-5 h-5 text-primary-600 rounded" />
                  <span className="font-medium text-secondary-900">{PAYMENT_METHOD_LABELS[method] ?? method}</span>
                </label>
              );
            })}
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-secondary-100">
            <label className="flex items-center gap-2 text-sm text-secondary-700">
              <input type="checkbox" checked={setForm.delivery_enabled ?? true} onChange={(e) => setSetForm({ ...setForm, delivery_enabled: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
              Livraison activée
            </label>
            <label className="flex items-center gap-2 text-sm text-secondary-700">
              <input type="checkbox" checked={setForm.pickup_enabled ?? true} onChange={(e) => setSetForm({ ...setForm, pickup_enabled: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
              Retrait activé
            </label>
            <label className="flex items-center gap-2 text-sm text-secondary-700">
              <input type="checkbox" checked={setForm.dine_in_enabled ?? true} onChange={(e) => setSetForm({ ...setForm, dine_in_enabled: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
              Sur place activé
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Montant minimum de commande (FCFA)</label>
            <input type="number" value={setForm.min_order_amount ?? 0} onChange={(e) => setSetForm({ ...setForm, min_order_amount: parseFloat(e.target.value) })} className="input-field" />
          </div>
          <button onClick={handleSaveSettings} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Enregistrer
          </button>
        </div>
      )}

      {/* Delivery tab */}
      {tab === 'delivery' && (
        <DeliveryTab zones={zones ?? []} refetch={refetchZones} />
      )}
    </div>
  );
}

function DeliveryTab({ zones, refetch }: { zones: DeliveryZone[]; refetch: () => void }) {
  const [newZone, setNewZone] = useState({ name: '', fee: '', min_order: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZone.name || !newZone.fee) return;
    setSaving(true);
    const { error } = await supabase.from('delivery_zones').insert({
      restaurant_id: RESTAURANT_ID,
      name: newZone.name,
      fee: parseFloat(newZone.fee),
      min_order: parseFloat(newZone.min_order) || 0,
      is_active: true,
    });
    if (!error) {
      setNewZone({ name: '', fee: '', min_order: '' });
      refetch();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette zone ?')) return;
    await supabase.from('delivery_zones').delete().eq('id', id);
    refetch();
  };

  const handleToggle = async (zone: DeliveryZone) => {
    await supabase.from('delivery_zones').update({ is_active: !zone.is_active }).eq('id', zone.id);
    refetch();
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card p-6">
        <h2 className="font-semibold text-secondary-900 mb-4">Zones de livraison</h2>
        {zones.length > 0 ? (
          <div className="space-y-2 mb-4">
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
                <div>
                  <p className="font-medium text-secondary-900 text-sm">{zone.name}</p>
                  <p className="text-xs text-secondary-500">Frais: {zone.fee} FCFA{zone.min_order > 0 ? ` • Min: ${zone.min_order} FCFA` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(zone)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${zone.is_active ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-600'}`}>
                    {zone.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => handleDelete(zone.id)} className="p-2 bg-error-50 text-error-600 rounded-lg hover:bg-error-100 transition-colors text-xs">
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-secondary-400 mb-4">Aucune zone configurée.</p>
        )}
        <form onSubmit={handleAdd} className="border-t border-secondary-100 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-secondary-700">Ajouter une zone</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input required type="text" placeholder="Nom (ex: Centre-ville)" value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} className="input-field" />
            <input required type="number" placeholder="Frais (FCFA)" value={newZone.fee} onChange={(e) => setNewZone({ ...newZone, fee: e.target.value })} className="input-field" />
            <input type="number" placeholder="Min. commande" value={newZone.min_order} onChange={(e) => setNewZone({ ...newZone, min_order: e.target.value })} className="input-field" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Ajouter la zone
          </button>
        </form>
      </div>
    </div>
  );
}
