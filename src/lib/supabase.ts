import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
  // Disable email confirmation for local dev
    signupOptions: {
      emailRedirectTo: window.location.origin + '/admin',
    },
  },
});

export const RESTAURANT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

// Storage bucket name for payment proofs
export const PROOF_BUCKET = 'payment-proofs';
export const PRODUCT_BUCKET = 'product-images';
