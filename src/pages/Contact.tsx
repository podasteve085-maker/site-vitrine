import { Phone, MessageCircle, MapPin, Mail, Clock, Instagram, Facebook, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Restaurant, RestaurantSettings } from '@/lib/types';
import { getTodayHours, isRestaurantOpen } from '@/lib/format';

export default function Contact() {
  const { data: restaurant } = useFetch<Restaurant>(async () => {
    const { data, error } = await supabase.from('restaurants').select('*').eq('id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const { data: settings } = useFetch<RestaurantSettings>(async () => {
    const { data, error } = await supabase.from('restaurant_settings').select('*').eq('restaurant_id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    // Send via WhatsApp
    if (!restaurant?.whatsapp) {
      setError("Le restaurant n'a pas configuré de numéro WhatsApp.");
      setSending(false);
      return;
    }

    const phone = restaurant.whatsapp.replace(/[^0-9]/g, '');
    const message = `Bonjour, je suis ${form.name} (${form.phone}). ${form.message}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setSent(true);
    setSending(false);
  };

  const isOpen = isRestaurantOpen(settings?.opening_hours);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-secondary-900">Contactez-nous</h1>
        <p className="text-secondary-500 mt-2">Nous sommes là pour répondre à vos questions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className={`badge ${isOpen ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
                {isOpen ? 'Ouvert' : 'Fermé'}
              </span>
              <span className="text-sm text-secondary-500 flex items-center gap-1">
                <Clock className="w-4 h-4" /> {getTodayHours(settings?.opening_hours)}
              </span>
            </div>
            <h2 className="font-semibold text-secondary-900 mb-3">{restaurant?.name ?? 'Le Baoulé Gourmand'}</h2>
            <div className="space-y-3">
              {restaurant?.phone && (
                <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 text-secondary-700 hover:text-primary-600 transition-colors">
                  <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary-600" />
                  </div>
                  <span>{restaurant.phone}</span>
                </a>
              )}
              {restaurant?.whatsapp && (
                <a
                  href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(settings?.whatsapp_message ?? 'Bonjour')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-secondary-700 hover:text-success-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-success-50 rounded-full flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-success-600" />
                  </div>
                  <span>WhatsApp</span>
                </a>
              )}
              {restaurant?.email && (
                <a href={`mailto:${restaurant.email}`} className="flex items-center gap-3 text-secondary-700 hover:text-primary-600 transition-colors">
                  <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <span>{restaurant.email}</span>
                </a>
              )}
              {restaurant?.address && (
                <div className="flex items-start gap-3 text-secondary-700">
                  <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <span>{restaurant.address}, {restaurant?.city}, {restaurant?.country}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-secondary-100">
              {restaurant?.instagram && (
                <a href={restaurant.instagram} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-600 transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {restaurant?.facebook && (
                <a href={restaurant.facebook} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-600 transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>

          {/* Map */}
          {restaurant?.gps_lat && restaurant?.gps_lng && (
            <a
              href={`https://www.google.com/maps?q=${restaurant.gps_lat},${restaurant.gps_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-5 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-secondary-900">Voir sur Google Maps</p>
                  <p className="text-sm text-secondary-500">{restaurant.address ?? 'Ouagadougou'}</p>
                </div>
              </div>
            </a>
          )}
        </div>

        {/* Contact form */}
        <div className="card p-6">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h2 className="font-semibold text-secondary-900 text-lg">Message envoyé !</h2>
              <p className="text-sm text-secondary-500 mt-2">Votre message a été ouvert dans WhatsApp. N'hésitez pas à nous appeler aussi.</p>
              <button onClick={() => setSent(false)} className="btn-secondary mt-4">Envoyer un autre message</button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <h2 className="font-semibold text-secondary-900">Envoyer un message</h2>
              {error && (
                <div className="bg-error-50 border border-error-200 text-error-700 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Votre nom *</label>
                <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Votre nom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Téléphone *</label>
                <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+226..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Message *</label>
                <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field" rows={4} placeholder="Votre message..." />
              </div>
              <button type="submit" disabled={sending} className="btn-primary w-full">
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Envoyer sur WhatsApp
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
