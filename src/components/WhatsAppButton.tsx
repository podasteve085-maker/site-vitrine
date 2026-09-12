import { MessageCircle } from 'lucide-react';
import { supabase, RESTAURANT_ID } from '@/lib/supabase';
import { useFetch } from '@/hooks/useFetch';
import type { Restaurant, RestaurantSettings } from '@/lib/types';

export default function WhatsAppButton() {
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

  if (!restaurant?.whatsapp) return null;

  const message = encodeURIComponent(settings?.whatsapp_message ?? 'Bonjour, je souhaite avoir des informations concernant votre menu.');
  const phone = restaurant.whatsapp.replace(/[^0-9]/g, '');

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      aria-label="Contacter sur WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
    </a>
  );
}
