import { Link } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Instagram, Facebook, Clock, UtensilsCrossed } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Restaurant, RestaurantSettings } from '@/lib/types';
import { getTodayHours, isRestaurantOpen } from '@/lib/format';

export default function Footer() {
  const { data: restaurant } = useFetch<Restaurant>(async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .maybeSingle();
    return { data, error };
  });

  const { data: settings } = useFetch<RestaurantSettings>(async () => {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .maybeSingle();
    return { data, error };
  });

  const isOpen = isRestaurantOpen(settings?.opening_hours);

  return (
    <footer className="bg-secondary-950 text-secondary-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                {restaurant?.name ?? 'Le Baoulé Gourmand'}
              </span>
            </div>
            <p className="text-secondary-400 text-sm leading-relaxed max-w-md">
              {restaurant?.description ??
                'Restaurant authentique burkinabè. Cuisine traditionnelle et moderne, grillades, plats épicés et douceurs locales.'}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className={`badge ${isOpen ? 'bg-success-500/20 text-success-500' : 'bg-error-500/20 text-error-500'}`}>
                {isOpen ? 'Ouvert maintenant' : 'Fermé'}
              </span>
              <span className="text-xs text-secondary-400">
                {getTodayHours(settings?.opening_hours)}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Accueil</Link></li>
              <li><Link to="/menu" className="hover:text-primary-400 transition-colors">Menu</Link></li>
              <li><Link to="/reservation" className="hover:text-primary-400 transition-colors">Réserver</Link></li>
              <li><Link to="/about" className="hover:text-primary-400 transition-colors">À propos</Link></li>
              <li><Link to="/contact" className="hover:text-primary-400 transition-colors">Contact</Link></li>
              <li><Link to="/track" className="hover:text-primary-400 transition-colors">Suivre ma commande</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              {restaurant?.phone && (
                <li>
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 hover:text-primary-400 transition-colors">
                    <Phone className="w-4 h-4 shrink-0" /> {restaurant.phone}
                  </a>
                </li>
              )}
              {restaurant?.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(settings?.whatsapp_message ?? 'Bonjour')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" /> WhatsApp
                  </a>
                </li>
              )}
              {restaurant?.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> {restaurant.address}, {restaurant?.city}
                </li>
              )}
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" /> {getTodayHours(settings?.opening_hours)}
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              {restaurant?.instagram && (
                <a href={restaurant.instagram} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-400 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {restaurant?.facebook && (
                <a href={restaurant.facebook} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-400 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-secondary-500">
            © {new Date().getFullYear()} {restaurant?.name ?? 'Le Baoulé Gourmand'}. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-xs text-secondary-500">
            <Link to="/admin" className="hover:text-primary-400 transition-colors">Espace administrateur</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
