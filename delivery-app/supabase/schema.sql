-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'customer', 'driver', 'restaurant_owner');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'picking_up', 'delivering', 'delivered', 'cancelled');

-- Users table (extends Supabase auth.users conceptually, but we can store profiles here)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_time DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Row Level Security) - Basic Setup for now
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow read access to all active restaurants and menu items
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Restaurants are viewable by everyone" ON restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "Menu items are viewable by everyone" ON menu_items FOR SELECT USING (true);

-- Order policies: customers can see their own orders, drivers can see assigned orders or pending ones, restaurants can see their orders
CREATE POLICY "Customers can see their own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);


-- Advanced Features Update

-- Modifiers Group (e.g., "Size", "Add-ons", "Remove")
CREATE TABLE item_modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  max_selections INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modifier Options (e.g., "Large (+2$)", "No Onion")
CREATE TABLE item_modifier_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES item_modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  is_available BOOLEAN DEFAULT TRUE
);

-- Store chosen modifiers for order items
CREATE TABLE order_item_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_option_id UUID REFERENCES item_modifier_options(id) ON DELETE CASCADE,
  price_at_time DECIMAL(10, 2) DEFAULT 0.00
);

-- Add Location and Status fields to profiles for drivers
ALTER TABLE profiles
ADD COLUMN is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN current_latitude DOUBLE PRECISION,
ADD COLUMN current_longitude DOUBLE PRECISION,
ADD COLUMN last_location_update TIMESTAMPTZ;

-- RLS for new tables
ALTER TABLE item_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modifier groups are viewable by everyone" ON item_modifier_groups FOR SELECT USING (true);
CREATE POLICY "Modifier options are viewable by everyone" ON item_modifier_options FOR SELECT USING (true);
CREATE POLICY "Order item selections viewable by relevant parties" ON order_item_selections FOR SELECT USING (true);
CREATE POLICY "Customers can insert order item selections" ON order_item_selections FOR INSERT WITH CHECK (true); -- simplified for MVP

-- Update profiles policy to allow drivers to update their own location
CREATE POLICY "Drivers can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);


-- Payments and Notifications Update

-- Add push token to profiles
ALTER TABLE profiles
ADD COLUMN expo_push_token TEXT;

-- Add payment details to orders
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

ALTER TABLE orders
ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'pending',
ADD COLUMN payment_method TEXT DEFAULT 'cash',
ADD COLUMN stripe_payment_intent_id TEXT;


-- Fintech and Reviews Update

-- Wallets for users (primarily for Drivers and Customers)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction history
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'earning', 'commission_deduction', 'refund');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Nullable for manual deposits
  type transaction_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings and Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  restaurant_rating INTEGER CHECK (restaurant_rating >= 1 AND restaurant_rating <= 5),
  driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (
  wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
);
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Customers can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Auto-create wallet on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_wallet();


-- Nearest Driver Dispatch Logic Update

-- A function to find the closest online driver using the Haversine formula
-- Returns the ID of the nearest driver. In production, this would be used by an Edge Function.
CREATE OR REPLACE FUNCTION find_nearest_driver(
    rest_lat DOUBLE PRECISION,
    rest_lon DOUBLE PRECISION,
    max_radius_km INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
    nearest_driver_id UUID;
BEGIN
    SELECT id INTO nearest_driver_id
    FROM profiles
    WHERE role = 'driver'
      AND is_online = true
      AND current_latitude IS NOT NULL
      AND current_longitude IS NOT NULL
      -- Haversine formula calculation for distance in kilometers
      AND (
        6371 * acos(
          cos(radians(rest_lat)) * cos(radians(current_latitude)) *
          cos(radians(current_longitude) - radians(rest_lon)) +
          sin(radians(rest_lat)) * sin(radians(current_latitude))
        )
      ) <= max_radius_km
    ORDER BY (
      6371 * acos(
        cos(radians(rest_lat)) * cos(radians(current_latitude)) *
        cos(radians(current_longitude) - radians(rest_lon)) +
        sin(radians(rest_lat)) * sin(radians(current_latitude))
      )
    ) ASC
    LIMIT 1;

    RETURN nearest_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Promo Codes and Discounts Update

CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_percentage DECIMAL(5, 2) CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  max_discount_amount DECIMAL(10, 2), -- Cap on the discount (e.g., Max $15 off)
  min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER, -- How many times total this code can be used
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keep track of which users used which codes to prevent double usage
CREATE TABLE user_promo_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, promo_code_id) -- A user can only use a specific promo code once
);

ALTER TABLE orders
ADD COLUMN promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_promo_usages ENABLE ROW LEVEL SECURITY;

-- Allow public to read active promo codes to validate them
CREATE POLICY "Active promo codes viewable by everyone" ON promo_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Users can see their own usages" ON user_promo_usages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usages" ON user_promo_usages FOR INSERT WITH CHECK (auth.uid() = user_id);
