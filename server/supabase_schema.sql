-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'collector', 'admin')) NOT NULL,
    name TEXT NOT NULL,
    dept TEXT DEFAULT '',
    block TEXT CHECK (block IN ('A', 'B', 'C', 'D', 'E')),
    avatar TEXT,
    reward_points INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- BINDATA TABLE
CREATE TABLE IF NOT EXISTS bin_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bin_id TEXT NOT NULL,
    block TEXT CHECK (block IN ('A', 'B', 'C', 'D', 'E')) NOT NULL,
    level INTEGER CHECK (level >= 0 AND level <= 100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    location_data JSONB DEFAULT '{}'::jsonb,
    waste_type TEXT NOT NULL,
    description TEXT NOT NULL,
    block TEXT CHECK (block IN ('A', 'B', 'C', 'D', 'E')) NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('pending', 'in-progress', 'in_progress', 'completed', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    type TEXT CHECK (type IN ('complaint', 'scan', 'iot')) DEFAULT 'complaint',
    bin_id TEXT,
    status_history JSONB DEFAULT '[]'::jsonb,
    image TEXT,
    completion_image TEXT,
    reward_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- REWARDS TABLE
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity TEXT NOT NULL,
    points INTEGER CHECK (points >= 1) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STOREITEMS TABLE
CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    points_required INTEGER CHECK (points_required >= 1) NOT NULL,
    stock INTEGER CHECK (stock >= 0) DEFAULT 0,
    category TEXT CHECK (category IN ('stationery', 'accessories', 'home', 'garden', 'other')) DEFAULT 'other',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT UNIQUE NOT NULL,
    user_name TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    block TEXT,
    item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    points_used INTEGER NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'ready_for_pickup', 'delivered')) DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_collector_name TEXT,
    pickup_location TEXT DEFAULT 'Admin Office / College Store Room',
    pickup_time TEXT DEFAULT '10 AM – 5 PM',
    pickup_code TEXT UNIQUE,
    failed_attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    reward_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('complaint', 'reward', 'user', 'iot', 'info')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ORDERLOGS TABLE
CREATE TABLE IF NOT EXISTS order_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL,
    action TEXT CHECK (action IN ('viewed', 'delivered', 'failed_verification', 'locked')) NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE CASCADE,
    details TEXT DEFAULT '',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bin_data_updated_at BEFORE UPDATE ON bin_data FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_store_items_updated_at BEFORE UPDATE ON store_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
