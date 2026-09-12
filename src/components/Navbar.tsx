import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu as MenuIcon, X, Phone, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Restaurant } from '@/lib/types';

export default function Navbar() {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { data: restaurant } = useFetch<Restaurant>(async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .maybeSingle();
    return { data, error };
  });

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/menu', label: 'Menu' },
    { to: '/reservation', label: 'Réserver' },
    { to: '/about', label: 'À propos' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-secondary-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:block font-display font-bold text-lg text-secondary-900">
              {restaurant?.name ?? 'Le Baoulé Gourmand'}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 text-sm font-medium text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {restaurant?.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden lg:inline">Appeler</span>
              </a>
            )}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:scale-95 transition-all"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary-900 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-secondary-700"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-secondary-100 bg-white animate-slide-in-right">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-base font-medium text-secondary-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {restaurant?.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="flex items-center gap-2 px-4 py-3 text-base font-medium text-secondary-700 hover:bg-primary-50 rounded-lg"
              >
                <Phone className="w-5 h-5" /> Appeler le restaurant
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
