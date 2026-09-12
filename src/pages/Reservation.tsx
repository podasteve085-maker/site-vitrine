import { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { formatDate } from '@/lib/format';

export default function Reservation() {
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: 2,
    reservation_date: '',
    reservation_time: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!form.customer_name || !form.customer_phone || !form.reservation_date || !form.reservation_time) {
        setError('Veuillez remplir tous les champs obligatoires.');
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from('reservations').insert({
        restaurant_id: RESTAURANT_ID,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || null,
        party_size: form.party_size,
        reservation_date: form.reservation_date,
        reservation_time: form.reservation_time,
        notes: form.notes || null,
        status: 'pending',
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setForm({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        party_size: 2,
        reservation_date: '',
        reservation_time: '',
        notes: '',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success-600" />
        </div>
        <h1 className="font-display text-3xl font-bold text-secondary-900">Réservation envoyée !</h1>
        <p className="text-secondary-500 mt-2">
          Votre demande de réservation a bien été enregistrée. Le restaurant vous contactera pour confirmer.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="btn-primary mt-6"
        >
          Faire une autre réservation
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="font-display text-3xl font-bold text-secondary-900">Réserver une table</h1>
        <p className="text-secondary-500 mt-2">Réservez votre table en quelques secondes.</p>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 rounded-xl p-4 mb-6 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Date *</label>
            <input
              required
              type="date"
              min={today}
              value={form.reservation_date}
              onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Heure *</label>
            <input
              required
              type="time"
              value={form.reservation_time}
              onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Nombre de personnes</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, party_size: Math.max(1, form.party_size - 1) })}
              className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center hover:bg-secondary-200 active:scale-90 transition-all"
            >
              <span className="text-lg">−</span>
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary-400" />
              <span className="text-lg font-semibold text-secondary-900 w-8 text-center">{form.party_size}</span>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, party_size: Math.min(20, form.party_size + 1) })}
              className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center hover:bg-secondary-200 active:scale-90 transition-all"
            >
              <span className="text-lg">+</span>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">Commentaire (facultatif)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input-field"
            rows={2}
            placeholder="Demandes spéciales, allergies, occasion..."
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
          Réserver
        </button>
      </form>

      {form.reservation_date && (
        <p className="text-center text-sm text-secondary-400 mt-4">
          Réservation pour {form.party_size} personne{form.party_size > 1 ? 's' : ''}{form.reservation_time ? ` à ${form.reservation_time}` : ''}{form.reservation_date ? ` le ${formatDate(form.reservation_date)}` : ''}
        </p>
      )}
    </div>
  );
}
