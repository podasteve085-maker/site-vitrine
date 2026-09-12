import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Product, Category } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { Loading, EmptyState } from '@/components/Loading';

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('cat') ?? 'all');

  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  const { data: categories, loading: cLoading } = useFetch<Category[]>(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('is_active', true)
      .order('sort_order');
    return { data: data as Category[] | null, error };
  });

  const { data: products, loading: pLoading } = useFetch<Product[]>(async () => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('is_active', true)
      .order('sort_order');

    if (activeCategory !== 'all') {
      const cat = categories?.find((c) => c.slug === activeCategory);
      if (cat) query = query.eq('category_id', cat.id);
    }

    const { data, error } = await query;
    return { data: data as Product[] | null, error };
  }, [activeCategory, categories]);

  const setCategory = (slug: string) => {
    setActiveCategory(slug);
    if (slug === 'all') setSearchParams({});
    else setSearchParams({ cat: slug });
  };

  const filtered = products?.filter((p) =>
    search.trim() === '' ? true : p.name.toLowerCase().includes(search.toLowerCase()) || (p.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary-900 to-secondary-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Notre Menu</h1>
          <p className="text-secondary-300">Découvrez nos plats préparés avec passion</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-secondary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Rechercher un plat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setCategory('all')}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              Tous
            </button>
            {cLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-24 bg-secondary-100 rounded-full animate-pulse" />
                ))}
              </div>
            ) : (
              categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.slug)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat.slug
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pLoading ? (
          <Loading />
        ) : filtered && filtered.length > 0 ? (
          <>
            <p className="text-sm text-secondary-500 mb-4">
              {filtered.length} plat{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={search ? "Aucun résultat" : "Aucun plat dans cette catégorie"}
            message={search ? "Essayez une autre recherche." : "Les plats apparaîtront ici une fois ajoutés par le restaurant."}
          />
        )}
      </div>
    </div>
  );
}
