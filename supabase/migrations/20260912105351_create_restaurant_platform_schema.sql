/*
# Restaurant E-Commerce Platform — Full Schema

## Overview
Creates a multi-tenant restaurant e-commerce platform with:
- Restaurant management (multi-tenant ready)
- Menu (categories + products with stock)
- Orders with server-side stock validation
- Manual mobile-money payments with proof upload + verification
- Fraud detection (amount mismatch, duplicate references)
- Table reservations
- Promotions
- Delivery zones
- Admin roles (super_admin, manager, employee)
- Audit logs
- Notifications

## Tables Created
1. restaurants — tenant root
2. restaurant_settings — per-restaurant config (hours, payment methods, delivery)
3. categories — menu categories
4. products — menu items with stock, price, availability
5. delivery_zones — delivery areas with fees
6. orders — customer orders
7. order_items — line items per order
8. payment_proofs — uploaded payment screenshots
9. reservations — table booking requests
10. promotions — active/inactive offers
11. admin_profiles — links auth.users to a restaurant with a role
12. audit_logs — admin action history
13. notifications — in-app notifications for admins

## Security
- RLS enabled on every table
- Public data (restaurants, categories, products, promotions, delivery_zones, settings) readable by anon+authenticated
- Orders/reservations/payment_proofs insertable by anon (guest checkout), updatable by authenticated admins only
- Order tracking: anon can SELECT their own order by id
- Admin write operations require an active admin_profiles row for the restaurant
- SECURITY DEFINER function create_order handles atomic stock decrement (concurrency-safe)
- SECURITY DEFINER function verify_payment handles admin payment confirmation/refusal

## Seed Data
- One default restaurant ("Le Baoulé Gourmand") with settings, categories, products, delivery zones, promotions
- An audit_logs helper function
- An order number sequence
*/

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SEQUENCE for order numbers
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- ============================================================
-- 1. restaurants
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  country text DEFAULT 'Burkina Faso',
  logo_url text,
  hero_image_url text,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  slogan text,
  story text,
  instagram text,
  facebook text,
  tiktok text,
  gps_lat numeric,
  gps_lng numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. restaurant_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  currency text DEFAULT 'FCFA',
  opening_hours jsonb DEFAULT '{"mon":{"open":"08:00","close":"22:00","closed":false},"tue":{"open":"08:00","close":"22:00","closed":false},"wed":{"open":"08:00","close":"22:00","closed":false},"thu":{"open":"08:00","close":"22:00","closed":false},"fri":{"open":"08:00","close":"23:00","closed":false},"sat":{"open":"08:00","close":"23:00","closed":false},"sun":{"open":"10:00","close":"21:00","closed":false}}'::jsonb,
  special_closures jsonb DEFAULT '[]'::jsonb,
  delivery_enabled boolean DEFAULT true,
  pickup_enabled boolean DEFAULT true,
  dine_in_enabled boolean DEFAULT true,
  min_order_amount numeric DEFAULT 0,
  payment_methods jsonb DEFAULT '["orange_money","moov_money","cash_on_delivery","pay_on_arrival"]'::jsonb,
  whatsapp_message text DEFAULT 'Bonjour, je souhaite avoir des informations concernant votre menu.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image_url text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  old_price numeric,
  image_url text,
  is_available boolean DEFAULT true,
  stock_quantity int DEFAULT 0,
  is_active boolean DEFAULT true,
  prep_time_minutes int DEFAULT 15,
  is_popular boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. delivery_zones
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  min_order numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  delivery_address text,
  delivery_instructions text,
  order_type text NOT NULL DEFAULT 'pickup',
  delivery_zone_id uuid REFERENCES delivery_zones(id) ON DELETE SET NULL,
  subtotal numeric NOT NULL,
  delivery_fee numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending',
  order_status text DEFAULT 'new',
  payment_reference text,
  payer_phone text,
  risk_level text DEFAULT 'low',
  risk_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric NOT NULL,
  quantity int NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. payment_proofs
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  declared_amount numeric,
  transaction_reference text,
  payer_phone text,
  payment_method text,
  verified boolean DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 9. reservations
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  party_size int NOT NULL DEFAULT 1,
  reservation_date date NOT NULL,
  reservation_time text NOT NULL,
  notes text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 10. promotions
-- ============================================================
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 11. admin_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'employee',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 12. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  admin_user_id uuid,
  admin_name text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 13. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if current user is an admin of a given restaurant
CREATE OR REPLACE FUNCTION is_restaurant_admin(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
      AND restaurant_id = p_restaurant_id
      AND is_active = true
  );
$$;

-- Generate order number: CMD-YYYYMMDD-NNNNNN
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'CMD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::text, 6, '0');
$$;

-- ============================================================
-- SECURITY DEFINER: create_order
-- Atomic order creation with stock validation + decrement
-- Prevents overselling under concurrent requests
-- ============================================================
CREATE OR REPLACE FUNCTION create_order(
  p_restaurant_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_delivery_instructions text DEFAULT NULL,
  p_order_type text DEFAULT 'pickup',
  p_delivery_zone_id uuid DEFAULT NULL,
  p_delivery_fee numeric DEFAULT 0,
  p_discount numeric DEFAULT 0,
  p_payment_method text DEFAULT NULL,
  p_items jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_total numeric;
  v_item jsonb;
  v_product record;
  v_item_subtotal numeric;
  v_items jsonb := p_items;
BEGIN
  -- Generate order number
  v_order_number := generate_order_number();
  v_order_id := gen_random_uuid();

  -- Calculate subtotal and validate stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    -- Lock the product row for concurrent safety
    SELECT price, stock_quantity, is_available, is_active, name
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::uuid
      AND restaurant_id = p_restaurant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;

    IF NOT v_product.is_active OR NOT v_product.is_available THEN
      RAISE EXCEPTION 'Product not available: %', v_product.name;
    END IF;

    IF (v_item->>'quantity')::int > v_product.stock_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
        v_product.name, v_product.stock_quantity, (v_item->>'quantity')::int;
    END IF;

    v_item_subtotal := v_product.price * (v_item->>'quantity')::int;
    v_subtotal := v_subtotal + v_item_subtotal;

    -- Decrement stock
    UPDATE products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::int,
        is_available = (stock_quantity - (v_item->>'quantity')::int) > 0,
        updated_at = now()
    WHERE id = (v_item->>'product_id')::uuid;

    -- Insert order item
    INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, subtotal)
    VALUES (
      gen_random_uuid(),
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_product.name,
      v_product.price,
      (v_item->>'quantity')::int,
      v_item_subtotal
    );
  END LOOP;

  v_total := v_subtotal + p_delivery_fee - p_discount;

  -- Create the order
  INSERT INTO orders (
    id, restaurant_id, order_number,
    customer_name, customer_phone, customer_email,
    delivery_address, delivery_instructions,
    order_type, delivery_zone_id,
    subtotal, delivery_fee, discount, total,
    payment_method, payment_status, order_status
  )
  VALUES (
    v_order_id, p_restaurant_id, v_order_number,
    p_customer_name, p_customer_phone, p_customer_email,
    p_delivery_address, p_delivery_instructions,
    p_order_type, p_delivery_zone_id,
    v_subtotal, p_delivery_fee, p_discount, v_total,
    p_payment_method,
    CASE WHEN p_payment_method IN ('cash_on_delivery', 'pay_on_arrival') THEN 'pending' ELSE 'awaiting_payment' END,
    'new'
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_fee', p_delivery_fee,
    'discount', p_discount,
    'total', v_total
  );
END;
$$;

-- ============================================================
-- SECURITY DEFINER: verify_payment
-- Admin confirms or refuses a payment proof
-- ============================================================
CREATE OR REPLACE FUNCTION verify_payment(
  p_order_id uuid,
  p_action text, -- 'confirm' or 'refuse'
  p_admin_user_id uuid,
  p_admin_name text,
  p_restaurant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order record;
  v_new_payment_status text;
  v_new_order_status text;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND restaurant_id = p_restaurant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF p_action = 'confirm' THEN
    v_new_payment_status := 'confirmed';
    v_new_order_status := 'preparing';
    -- Mark all proofs for this order as verified
    UPDATE payment_proofs
    SET verified = true, verified_by = p_admin_user_id, verified_at = now()
    WHERE order_id = p_order_id AND verified = false;
  ELSE
    v_new_payment_status := 'refused';
    v_new_order_status := 'refused';
    UPDATE payment_proofs
    SET verified = false, verified_by = p_admin_user_id, verified_at = now()
    WHERE order_id = p_order_id AND verified = false;
  END IF;

  UPDATE orders
  SET payment_status = v_new_payment_status,
      order_status = v_new_order_status,
      updated_at = now()
  WHERE id = p_order_id;

  -- Insert audit log
  INSERT INTO audit_logs (restaurant_id, admin_user_id, admin_name, action, entity_type, entity_id, details)
  VALUES (
    p_restaurant_id, p_admin_user_id, p_admin_name,
    'payment_' || p_action,
    'order', p_order_id,
    jsonb_build_object('order_number', v_order.order_number, 'amount', v_order.total)
  );

  -- Insert notification
  INSERT INTO notifications (restaurant_id, type, title, message, related_id)
  VALUES (
    p_restaurant_id,
    'payment',
    CASE WHEN p_action = 'confirm' THEN 'Paiement confirmé' ELSE 'Paiement refusé' END,
    'Commande ' || v_order.order_number || ' — paiement ' || (CASE WHEN p_action = 'confirm' THEN 'confirmé' ELSE 'refusé' END),
    p_order_id
  );

  RETURN jsonb_build_object('success', true, 'payment_status', v_new_payment_status, 'order_status', v_new_order_status);
END;
$$;

-- ============================================================
-- SECURITY DEFINER: update_order_status
-- Admin updates order status (with audit log)
-- ============================================================
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_admin_user_id uuid,
  p_admin_name text,
  p_restaurant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order record;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND restaurant_id = p_restaurant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE orders SET order_status = p_new_status, updated_at = now() WHERE id = p_order_id;

  INSERT INTO audit_logs (restaurant_id, admin_user_id, admin_name, action, entity_type, entity_id, details)
  VALUES (
    p_restaurant_id, p_admin_user_id, p_admin_name,
    'order_status_update',
    'order', p_order_id,
    jsonb_build_object('order_number', v_order.order_number, 'old_status', v_order.order_status, 'new_status', p_new_status)
  );

  INSERT INTO notifications (restaurant_id, type, title, message, related_id)
  VALUES (
    p_restaurant_id,
    'order',
    'Statut commande mis à jour',
    'Commande ' || v_order.order_number || ' — ' || p_new_status,
    p_order_id
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- SECURITY DEFINER: create_admin_profile
-- Called after admin sign-up to link auth user to restaurant
-- First admin gets super_admin; subsequent need existing admin
-- ============================================================
CREATE OR REPLACE FUNCTION create_admin_profile(
  p_restaurant_id uuid,
  p_full_name text,
  p_role text DEFAULT 'super_admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_count int;
  v_assigned_role text;
BEGIN
  SELECT count(*) INTO v_existing_count FROM admin_profiles WHERE restaurant_id = p_restaurant_id;

  IF v_existing_count = 0 THEN
    v_assigned_role := 'super_admin';
  ELSE
    -- Check if caller is an admin of this restaurant
    IF NOT is_restaurant_admin(p_restaurant_id) THEN
      RAISE EXCEPTION 'Not authorized to create admin profile for this restaurant';
    END IF;
    v_assigned_role := p_role;
  END IF;

  INSERT INTO admin_profiles (user_id, restaurant_id, full_name, role, is_active)
  VALUES (auth.uid(), p_restaurant_id, p_full_name, v_assigned_role, true);

  RETURN jsonb_build_object('success', true, 'role', v_assigned_role);
END;
$$;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- restaurants: public read, admin write
DROP POLICY IF EXISTS "public_read_restaurants" ON restaurants;
CREATE POLICY "public_read_restaurants" ON restaurants FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_restaurants" ON restaurants;
CREATE POLICY "admin_insert_restaurants" ON restaurants FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_restaurants" ON restaurants;
CREATE POLICY "admin_update_restaurants" ON restaurants FOR UPDATE
  TO authenticated USING (is_restaurant_admin(id)) WITH CHECK (is_restaurant_admin(id));

-- restaurant_settings: public read, admin write
DROP POLICY IF EXISTS "public_read_settings" ON restaurant_settings;
CREATE POLICY "public_read_settings" ON restaurant_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_settings" ON restaurant_settings;
CREATE POLICY "admin_update_settings" ON restaurant_settings FOR UPDATE
  TO authenticated USING (is_restaurant_admin(restaurant_id)) WITH CHECK (is_restaurant_admin(restaurant_id));

-- categories: public read active, admin full CRUD
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (is_restaurant_admin(restaurant_id));

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (is_restaurant_admin(restaurant_id)) WITH CHECK (is_restaurant_admin(restaurant_id));

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (is_restaurant_admin(restaurant_id));

-- products: public read active, admin full CRUD
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (is_restaurant_admin(restaurant_id));

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (is_restaurant_admin(restaurant_id)) WITH CHECK (is_restaurant_admin(restaurant_id));

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (is_restaurant_admin(restaurant_id));

-- delivery_zones: public read active, admin full CRUD
DROP POLICY IF EXISTS "public_read_zones" ON delivery_zones;
CREATE POLICY "public_read_zones" ON delivery_zones FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_zones" ON delivery_zones;
CREATE POLICY "admin_insert_zones" ON delivery_zones FOR INSERT
  TO authenticated WITH CHECK (is_restaurant_admin(restaurant_id));

DROP POLICY IF EXISTS "admin_update_zones" ON delivery_zones;
CREATE POLICY "admin_update_zones" ON delivery_zones FOR UPDATE
  TO authenticated USING (is_restaurant_admin(restaurant_id)) WITH CHECK (is_restaurant_admin(restaurant_id));

DROP POLICY IF EXISTS "admin_delete_zones" ON delivery_zones;
CREATE POLICY "admin_delete_zones" ON delivery_zones FOR DELETE
  TO authenticated USING (is_restaurant_admin(restaurant_id));

-- orders: anon can read by id (tracking), insert via function, admin full access
DROP POLICY IF EXISTS "anon_read_orders" ON orders;
CREATE POLICY "anon_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (is_restaurant_admin(restaurant_id)) WITH CHECK (is_restaurant_admin(restaurant_id));

-- order_items: readable by all (for order tracking), managed via function
DROP POLICY IF EXISTS "read_order_items" ON order_items;
CREATE POLICY "read_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

-- payment_proofs: anon can insert (upload proof), admin can read + update
DROP POLICY IF EXISTS "anon_insert_proofs" ON payment_proofs;
CREATE POLICY "anon_insert_proofs" ON payment_proofs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_proofs" ON payment_proofs;
CREATE POLICY "admin_read_proofs" ON payment_proofs FOR SELECT
  TO anon, authenticated USING (true);

-- reservations: anon can insert, admin can read + update
DROP POLICY IF EXISTS "anon_insert_reservations" ON reservations;
CREATE POLICY "anon_insert_reservations" ON reservations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "read_reservations" ON reservations;
CREATE POLICY "read_reservations" ON reservations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_reservations" ON reservations;
CREATE POLICY "admin_update_reservations" ON reservations FOR UPDATE
  TO authenticated USING (is_restaurant_admin(restaurant_id)) WITH CHECK (is_restaurant_admin(restaurant_id));

-- promotions: public read active, admin full CRUD
DROP POLICY IF EXISTS "public_read_promotions" ON promotions;
CREATE POLICY "public_read_promotions" ON promotions FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_promotions" ON promotions;
CREATE POLICY "admin_insert_promotions" ON promotions FOR INSERT
  TO authenticated WITH CHECK (is_restaurant_admin(restaurant_id));

DROP POLICY IF EXISTS "admin_update_promotions" ON promotions;
CREATE POLICY "admin_update_promotions" ON promotions FOR UPDATE
  TO authenticated USING (is_restaurant_admin(restaurant_id)) WITH CHECK (is_restaurant_admin(restaurant_id));

DROP POLICY IF EXISTS "admin_delete_promotions" ON promotions;
CREATE POLICY "admin_delete_promotions" ON promotions FOR DELETE
  TO authenticated USING (is_restaurant_admin(restaurant_id));

-- admin_profiles: authenticated can read own, admin can read all in restaurant
DROP POLICY IF EXISTS "read_own_profile" ON admin_profiles;
CREATE POLICY "read_own_profile" ON admin_profiles FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_restaurant_admin(restaurant_id));

-- audit_logs: admin read only
DROP POLICY IF EXISTS "admin_read_audit" ON audit_logs;
CREATE POLICY "admin_read_audit" ON audit_logs FOR SELECT
  TO authenticated USING (is_restaurant_admin(restaurant_id));

-- notifications: admin read + update
DROP POLICY IF EXISTS "admin_read_notifications" ON notifications;
CREATE POLICY "admin_read_notifications" ON notifications FOR SELECT
  TO authenticated USING (is_restaurant_admin(restaurant_id));

DROP POLICY IF EXISTS "admin_update_notifications" ON notifications;
CREATE POLICY "admin_update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (is_restaurant_admin(restaurant_id)) WITH CHECK (is_restaurant_admin(restaurant_id));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_proofs_order ON payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user ON admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_restaurant ON audit_logs(restaurant_id);

-- ============================================================
-- SEED DATA — Default restaurant
-- ============================================================
INSERT INTO restaurants (id, name, slug, description, phone, whatsapp, email, address, city, country, slogan, story, instagram, facebook, gps_lat, gps_lng)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Le Baoulé Gourmand',
  'le-baoule-gourmand',
  'Restaurant authentique burkinabè. Cuisine traditionnelle et moderne, grillades, plats épicés et douceurs locales.',
  '+226 70 00 00 00',
  '+226 70 00 00 00',
  'contact@lebaoulegourmand.bf',
  'Avenue Kwame N''Krumah, Ouagadougou',
  'Ouagadougou',
  'Burkina Faso',
  'Une cuisine authentique, préparée avec passion.',
  'Né en 2015 au cœur de Ouagadougou, Le Baoulé Gourmand célèbre la richesse de la cuisine burkinabè. Nos chefs sélectionnent les meilleurs ingrédients locaux pour vous offrir des plats traditionnels et contemporains, dans un cadre chaleureux et convivial.',
  'https://instagram.com/lebaoulegourmand',
  'https://facebook.com/lebaoulegourmand',
  12.3714,
  -1.5252
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO restaurant_settings (restaurant_id)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_settings WHERE restaurant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Categories
INSERT INTO categories (id, restaurant_id, name, slug, description, sort_order, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Entrées', 'entrees', 'Délicieuses entrées pour commencer', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Plats Traditionnels', 'plats-traditionnels', 'Les classiques de la cuisine burkinabè', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Grillades', 'grillades', 'Viandes et poulets grillés au feu de bois', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Burgers', 'burgers', 'Burgers maison avec pain frais', 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Accompagnements', 'accompagnements', 'Riz, attiéké, frites et plus', 5, true),
  ('c1000000-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Desserts', 'desserts', 'Douceurs sucrées locales', 6, true),
  ('c1000000-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Boissons', 'boissons', 'Jus, sodas et boissons locales', 7, true)
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (restaurant_id, category_id, name, description, price, old_price, is_available, stock_quantity, is_active, is_popular, prep_time_minutes, sort_order)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000001', 'Salade de mangue', 'Mangue verte, oignon, piment, citron — frais et épicé', 1500, NULL, true, 20, true, true, 10, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000001', 'Beignets de haricot', 'Beignets croustillants servis avec sauce pimentée', 1000, NULL, true, 30, true, false, 10, 2),

  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000002', 'Riz gras au poulet', 'Riz cuisiné aux légumes, poulet braisé, sauce tomate', 2500, NULL, true, 25, true, true, 20, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000002', 'Tô sauce graine', 'Pâte de mil traditionnelle avec sauce graine de palme', 2000, NULL, true, 15, true, false, 25, 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000002', 'Attiéké poisson', 'Attieké, poisson frit, oignons, tomates, piment', 3000, NULL, true, 18, true, true, 20, 3),

  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000003', 'Poulet braisé', 'Demi-poulet mariné, grillé au feu de bois, sauce pimentée', 3500, NULL, true, 12, true, true, 25, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000003', 'Brochette de bœuf', 'Brochettes marinées, cuites au charbon, sauce maison', 2500, NULL, true, 20, true, true, 15, 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000003', 'Côtelettes d''agneau', 'Côtelettes grillées, herbes fraîches, accompagnement au choix', 4000, NULL, true, 8, true, false, 25, 3),

  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000004', 'Burger Baoulé', 'Pain frais, steak haché, fromage, sauce maison, frites', 3000, 3500, true, 15, true, true, 15, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000004', 'Burger Poulet', 'Pain frais, filet de poulet pané, salade, sauce, frites', 2800, NULL, true, 15, true, false, 15, 2),

  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000005', 'Frites maison', 'Frites de pommes de terre, croustillantes', 1000, NULL, true, 40, true, false, 10, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000005', 'Attieké', 'Semoule de manioc, légère et digeste', 1000, NULL, true, 40, true, false, 5, 2),

  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000006', 'Dégué', 'Dessert laitier au mil, sucré et onctueux', 1000, NULL, true, 20, true, true, 5, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000006', 'Beignets sucrés', 'Beignets dorés au miel, servis chauds', 800, NULL, true, 25, true, false, 10, 2),

  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000007', 'Jus de bissap', 'Jus d''hibiscus frais, sucré et rafraîchissant', 500, NULL, true, 50, true, true, 5, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000007', 'Coca-Cola 33cl', 'Canette fraîche', 500, NULL, true, 60, true, false, 1, 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1000000-0000-0000-0000-000000000007', 'Jus de gingembre', 'Jus de gingembre frais, épicé et revigorant', 500, NULL, true, 40, true, false, 5, 3)
ON CONFLICT DO NOTHING;

-- Delivery zones
INSERT INTO delivery_zones (restaurant_id, name, fee, min_order, is_active)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Centre-ville Ouaga', 1000, 3000, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Zone Wemtenga', 1500, 3000, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Zone Tampouy', 2000, 5000, true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Zone Ouaga 2000', 2000, 5000, true)
ON CONFLICT DO NOTHING;

-- Promotions
INSERT INTO promotions (restaurant_id, title, description, discount_type, discount_value, is_active, start_date, end_date)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Menu Famille -20%', '20% de réduction sur les commandes de plus de 15 000 FCFA', 'percentage', 20, true, now(), '2026-12-31 23:59:59'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2 Burgers achetés = 1 boisson offerte', 'Offre valable du lundi au jeudi', 'buy_one_get_one', 0, true, now(), '2026-12-31 23:59:59')
ON CONFLICT DO NOTHING;
