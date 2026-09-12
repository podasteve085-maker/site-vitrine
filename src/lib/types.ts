export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  logo_url: string | null;
  hero_image_url: string | null;
  gallery_images: string[];
  slogan: string | null;
  story: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  is_active: boolean;
}

export interface RestaurantSettings {
  id: string;
  restaurant_id: string;
  currency: string;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
  special_closures: string[];
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  dine_in_enabled: boolean;
  min_order_amount: number;
  payment_methods: string[];
  whatsapp_message: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  is_available: boolean;
  stock_quantity: number;
  is_active: boolean;
  prep_time_minutes: number;
  is_popular: boolean;
  sort_order: number;
}

export interface DeliveryZone {
  id: string;
  restaurant_id: string;
  name: string;
  fee: number;
  min_order: number;
  is_active: boolean;
}

export interface Order {
  id: string;
  restaurant_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_instructions: string | null;
  order_type: string;
  delivery_zone_id: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string | null;
  payment_status: string;
  order_status: string;
  payment_reference: string | null;
  payer_phone: string | null;
  risk_level: string;
  risk_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  file_url: string;
  declared_amount: number | null;
  transaction_reference: string | null;
  payer_phone: string | null;
  payment_method: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export interface Promotion {
  id: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  restaurant_id: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  restaurant_id: string;
  admin_user_id: string | null;
  admin_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  restaurant_id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
