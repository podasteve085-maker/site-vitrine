import { Link } from 'react-router-dom';
import { UtensilsCrossed, Heart, Flame, MapPin, Clock, Phone, ShoppingBag, Calendar } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Restaurant, RestaurantSettings } from '@/lib/types';
import { getTodayHours, isRestaurantOpen } from '@/lib/format';

export default function About() {
  const { data: restaurant } = useFetch<Restaurant>(async () => {
    const { data, error } = await supabase.from('restaurants').select('*').eq('id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const { data: settings } = useFetch<RestaurantSettings>(async () => {
    const { data, error } = await supabase.from('restaurant_settings').select('*').eq('restaurant_id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const isOpen = isRestaurantOpen(settings?.opening_hours);
  const hours = settings?.opening_hours;
  const dayNames = [
    { key: 'mon', label: 'Lundi' },
    { key: 'tue', label: 'Mardi' },
    { key: 'wed', label: 'Mercredi' },
    { key: 'thu', label: 'Jeudi' },
    { key: 'fri', label: 'Vendredi' },
    { key: 'sat', label: 'Samedi' },
    { key: 'sun', label: 'Dimanche' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center">
        <div className="absolute inset-0">
          <img
            src={restaurant?.hero_image_url ?? 'https://images.pexels.com/photos/12181619/pexels-photo-12181619.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
            alt={restaurant?.name ?? 'Restaurant'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary-950/60 to-secondary-950/80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">
            {restaurant?.name ?? 'Le Baoulé Gourmand'}
          </h1>
          <p className="text-primary-300 text-lg mt-2">{restaurant?.slogan ?? 'Une cuisine authentique, préparée avec passion.'}</p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 justify-center mb-4">
          <Heart className="w-5 h-5 text-primary-600" />
          <span className="text-sm font-semibold uppercase tracking-wide text-primary-600">Notre histoire</span>
        </div>
        <h2 className="font-display text-3xl font-bold text-secondary-900 text-center mb-6">
          Une passion pour la cuisine burkinabè
        </h2>
        <p className="text-secondary-600 leading-relaxed text-center text-lg">
          {restaurant?.story ??
            'Né au cœur de Ouagadougou, nous célébrons la richesse de la cuisine burkinabè. Nos chefs sélectionnent les meilleurs ingrédients locaux pour vous offrir des plats traditionnels et contemporains, dans un cadre chaleureux et convivial.'}
        </p>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-secondary-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-secondary-900 text-lg">Cuisine authentique</h3>
              <p className="text-secondary-500 text-sm mt-2">Des recettes traditionnelles préparées avec des ingrédients locaux frais.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-secondary-900 text-lg">Grillades au feu de bois</h3>
              <p className="text-secondary-500 text-sm mt-2">Nos viandes et poulets sont grillés au charbon pour un goût unique.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-secondary-900 text-lg">Service chaleureux</h3>
              <p className="text-secondary-500 text-sm mt-2">Une équipe attentionnée pour vous offrir une expérience memorable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Hours */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-display text-3xl font-bold text-secondary-900 text-center mb-6">Horaires d'ouverture</h2>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`badge ${isOpen ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
              {isOpen ? 'Ouvert maintenant' : 'Fermé actuellement'}
            </span>
            <span className="text-sm text-secondary-500 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {getTodayHours(settings?.opening_hours)}
            </span>
          </div>
          <div className="space-y-2">
            {dayNames.map((day) => {
              const dayHours = hours?.[day.key];
              return (
                <div key={day.key} className="flex justify-between items-center py-2 border-b border-secondary-50 last:border-0">
                  <span className="text-sm font-medium text-secondary-700">{day.label}</span>
                  <span className={`text-sm ${dayHours?.closed ? 'text-error-500' : 'text-secondary-600'}`}>
                    {dayHours?.closed ? 'Fermé' : dayHours ? `${dayHours.open} - ${dayHours.close}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-2xl bg-gradient-to-br from-secondary-900 to-secondary-950 p-8 text-center text-white">
          <MapPin className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Nous trouver</h2>
          <p className="text-secondary-300 mb-1">{restaurant?.address ?? "Avenue Kwame N'Krumah"}</p>
          <p className="text-secondary-300 mb-6">{restaurant?.city ?? 'Ouagadougou'}, {restaurant?.country ?? 'Burkina Faso'}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {restaurant?.phone && (
              <a href={`tel:${restaurant.phone}`} className="btn-secondary bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Phone className="w-5 h-5" /> Appeler
              </a>
            )}
            {restaurant?.gps_lat && restaurant?.gps_lng && (
              <a
                href={`https://www.google.com/maps?q=${restaurant.gps_lat},${restaurant.gps_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <MapPin className="w-5 h-5" /> Google Maps
              </a>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center">
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/menu" className="btn-primary">
            <ShoppingBag className="w-5 h-5" /> Commander maintenant
          </Link>
          <Link to="/reservation" className="btn-secondary">
            <Calendar className="w-5 h-5" /> Réserver une table
          </Link>
        </div>
      </section>
    </div>
  );
}
