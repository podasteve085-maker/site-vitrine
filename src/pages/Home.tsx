import { Link } from 'react-router-dom';
import { ShoppingBag, Calendar, Phone, MapPin, Clock, Star, ArrowRight, Flame, Tag, MessageCircle } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Restaurant, RestaurantSettings, Product, Category, Promotion } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { Loading, EmptyState } from '@/components/Loading';
import { formatPrice, isRestaurantOpen, getTodayHours } from '@/lib/format';

export default function Home() {
  const { data: restaurant, loading: rLoading } = useFetch<Restaurant>(async () => {
    const { data, error } = await supabase.from('restaurants').select('*').eq('id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const { data: settings } = useFetch<RestaurantSettings>(async () => {
    const { data, error } = await supabase.from('restaurant_settings').select('*').eq('restaurant_id', RESTAURANT_ID).maybeSingle();
    return { data, error };
  });

  const { data: popularProducts, loading: pLoading } = useFetch<Product[]>(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('is_active', true)
      .eq('is_popular', true)
      .order('sort_order')
      .limit(6);
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

  const { data: promotions } = useFetch<Promotion[]>(async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3);
    return { data: data as Promotion[] | null, error };
  });

  const isOpen = isRestaurantOpen(settings?.opening_hours);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center">
        <div className="absolute inset-0">
          <img
            src={restaurant?.hero_image_url ?? 'https://images.pexels.com/photos/12181619/pexels-photo-12181619.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
            alt={restaurant?.name ?? 'Restaurant'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary-950/70 via-secondary-950/50 to-secondary-950/80" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className={`badge ${isOpen ? 'bg-success-500 text-white' : 'bg-error-500 text-white'}`}>
                {isOpen ? 'Ouvert maintenant' : 'Fermé actuellement'}
              </span>
              <span className="text-white/80 text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" /> {getTodayHours(settings?.opening_hours)}
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {restaurant?.name ?? 'Le Baoulé Gourmand'}
            </h1>
            <p className="text-xl text-primary-300 font-medium mt-2">
              {restaurant?.slogan ?? 'Une cuisine authentique, préparée avec passion.'}
            </p>
            <p className="text-white/80 mt-4 text-base sm:text-lg max-w-xl leading-relaxed">
              {restaurant?.description ??
                'Restaurant authentique burkinabè. Cuisine traditionnelle et moderne, grillades, plats épicés et douceurs locales.'}
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/menu" className="btn-primary text-base">
                <ShoppingBag className="w-5 h-5" /> Commander maintenant
              </Link>
              <Link to="/reservation" className="btn-secondary text-base bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Calendar className="w-5 h-5" /> Réserver une table
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions bar */}
      <section className="bg-white border-b border-secondary-100 -mt-px">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            {restaurant?.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors">
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary-600" />
                </div>
                Appeler
              </a>
            )}
            {restaurant?.whatsapp && (
              <a
                href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(settings?.whatsapp_message ?? 'Bonjour')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors"
              >
                <div className="w-10 h-10 bg-success-50 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-success-600" />
                </div>
                WhatsApp
              </a>
            )}
            <Link to="/menu" className="flex items-center gap-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary-600" />
              </div>
              Commander
            </Link>
            <Link to="/reservation" className="flex items-center gap-2 text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              Réserver
            </Link>
          </div>
        </div>
      </section>

      {/* Promotions */}
      {promotions && promotions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promotions.map((promo) => (
              <div key={promo.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white">
                <Tag className="absolute top-4 right-4 w-8 h-8 opacity-30" />
                <div className="text-3xl font-display font-bold mb-1">
                  {promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : 'Offre spéciale'}
                </div>
                <h3 className="font-semibold text-lg">{promo.title}</h3>
                <p className="text-white/80 text-sm mt-1">{promo.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular dishes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary-600 mb-1">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Les plus commandés</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-secondary-900">Plats populaires</h2>
          </div>
          <Link to="/menu" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 hover:gap-2 transition-all">
            Voir tout le menu <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {pLoading ? (
          <Loading />
        ) : popularProducts && popularProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState title="Aucun plat populaire" message="Les plats populaires apparaîtront ici." />
        )}

        <div className="sm:hidden mt-6">
          <Link to="/menu" className="btn-secondary w-full">
            Voir tout le menu <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="bg-white border-y border-secondary-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold text-secondary-900 mb-8 text-center">Nos catégories</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/menu?cat=${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-primary-50 transition-colors group"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <Flame className="w-8 h-8 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-secondary-700 text-center">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display text-3xl font-bold text-secondary-900 mb-4">
              {restaurant?.name ?? 'Le Baoulé Gourmand'}
            </h2>
            <p className="text-secondary-600 leading-relaxed">
              {restaurant?.story ??
                'Né au cœur de Ouagadougou, nous célébrons la richesse de la cuisine burkinabè. Nos chefs sélectionnent les meilleurs ingrédients locaux pour vous offrir des plats traditionnels et contemporains.'}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">Adresse</p>
                  <p className="text-sm text-secondary-500">{restaurant?.address ?? 'Ouagadougou'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">Horaires</p>
                  <p className="text-sm text-secondary-500">{getTodayHours(settings?.opening_hours)}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Link to="/about" className="btn-primary">En savoir plus</Link>
              <Link to="/contact" className="btn-secondary">Nous contacter</Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <img
              src={restaurant?.hero_image_url ?? 'https://images.pexels.com/photos/12181619/pexels-photo-12181619.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
              alt={restaurant?.name ?? 'Restaurant'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-white border-y border-secondary-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-secondary-900 mb-8 text-center">Avis clients</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Aminata S.', text: 'Le meilleur riz gras de Ouaga ! Livraison rapide et plats délicieux.', rating: 5 },
              { name: 'Issouf K.', text: 'Poulet braisé exceptionnel, service impeccable. Je recommande vivement.', rating: 5 },
              { name: 'Mariam D.', text: 'Cadre chaleureux, cuisine authentique. Mon restaurant préféré à Ouagadougou.', rating: 4 },
            ].map((review, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < review.rating ? 'text-warning-500 fill-warning-500' : 'text-secondary-200'}`}
                    />
                  ))}
                </div>
                <p className="text-secondary-600 text-sm leading-relaxed">"{review.text}"</p>
                <p className="text-sm font-medium text-secondary-900 mt-3">— {review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl bg-gradient-to-br from-secondary-900 to-secondary-950 p-8 sm:p-12 text-center text-white">
          <MapPin className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold mb-2">Venez nous rendre visite</h2>
          <p className="text-secondary-300 max-w-md mx-auto mb-6">
            {restaurant?.address ?? "Avenue Kwame N'Krumah"}, {restaurant?.city ?? 'Ouagadougou'}, {restaurant?.country ?? 'Burkina Faso'}
          </p>
          {restaurant?.gps_lat && restaurant?.gps_lng && (
            <a
              href={`https://www.google.com/maps?q=${restaurant.gps_lat},${restaurant.gps_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <MapPin className="w-5 h-5" /> Nous trouver sur Google Maps
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
