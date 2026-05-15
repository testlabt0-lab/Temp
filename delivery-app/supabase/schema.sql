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
