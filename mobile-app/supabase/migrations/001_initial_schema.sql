-- TimberLog Pro Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'trial',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '14 days',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    revenuecat_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bl_number VARCHAR(100) NOT NULL,
    bl_date DATE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, bl_number)
);

-- Containers table
CREATE TABLE IF NOT EXISTS public.containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sr_no INTEGER NOT NULL,
    container_number VARCHAR(50) NOT NULL,
    cbm_gross DECIMAL(10,4),
    cbm_net DECIMAL(10,4),
    pcs_supplier INTEGER,
    avg_girth_gross DECIMAL(10,4),
    avg_girth_net DECIMAL(10,4),
    l_avg DECIMAL(10,2),
    quality_supplier VARCHAR(100),
    bend_percent DECIMAL(5,2),
    quality_by_us VARCHAR(100),
    measurement_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_loading_complete BOOLEAN DEFAULT FALSE,
    loading_complete_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log measurements table
CREATE TABLE IF NOT EXISTS public.log_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    container_id UUID NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    log_number INTEGER NOT NULL,
    le1 DECIMAL(10,2) NOT NULL,
    l DECIMAL(10,2) NOT NULL,
    g1 DECIMAL(10,2) NOT NULL,
    g2 DECIMAL(10,2) NOT NULL,
    cbm1 DECIMAL(10,6) NOT NULL,
    cbm2 DECIMAL(10,6) NOT NULL,
    cft1 DECIMAL(10,6) NOT NULL,
    cft2 DECIMAL(10,6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Countries table
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Subscription events table (audit log)
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    plan VARCHAR(50),
    amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'INR',
    revenuecat_event_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App config table (remote feature flags)
CREATE TABLE IF NOT EXISTS public.app_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_bl_date ON public.purchases(bl_date);
CREATE INDEX IF NOT EXISTS idx_containers_purchase_id ON public.containers(purchase_id);
CREATE INDEX IF NOT EXISTS idx_containers_user_id ON public.containers(user_id);
CREATE INDEX IF NOT EXISTS idx_log_measurements_container_id ON public.log_measurements(container_id);
CREATE INDEX IF NOT EXISTS idx_log_measurements_user_id ON public.log_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_countries_user_id ON public.countries(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for purchases
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases" ON public.purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases" ON public.purchases
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for containers
CREATE POLICY "Users can view own containers" ON public.containers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own containers" ON public.containers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own containers" ON public.containers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own containers" ON public.containers
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for log_measurements
CREATE POLICY "Users can view own measurements" ON public.log_measurements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements" ON public.log_measurements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements" ON public.log_measurements
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for suppliers
CREATE POLICY "Users can view own suppliers" ON public.suppliers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suppliers" ON public.suppliers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own suppliers" ON public.suppliers
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for countries
CREATE POLICY "Users can view own countries" ON public.countries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own countries" ON public.countries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own countries" ON public.countries
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for subscription_events
CREATE POLICY "Users can view own subscription events" ON public.subscription_events
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for app_config (public read, admin write)
CREATE POLICY "Everyone can read app config" ON public.app_config
    FOR SELECT TO PUBLIC USING (true);

-- Insert default app config values
INSERT INTO public.app_config (key, value, description) VALUES
    ('trial_days', '14', 'Number of days for trial period'),
    ('max_free_bls', '3', 'Maximum BLs allowed in free/trial plan'),
    ('max_free_containers', '10', 'Maximum containers allowed in free/trial plan'),
    ('pro_price_monthly', '999', 'Pro plan monthly price in INR'),
    ('pro_price_yearly', '8999', 'Pro plan yearly price in INR')
ON CONFLICT (key) DO NOTHING;

-- Seed common timber countries (global, not user-specific initially)
-- Users will get their own copy when they use the app
-- This is just reference data

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON public.containers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON public.app_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Complete!
