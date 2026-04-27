-- Run this entire script in your Supabase SQL Editor
-- This will create the necessary tables for Akti DB

CREATE TABLE IF NOT EXISTS fb_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  password TEXT,
  country TEXT,
  rech TEXT,
  condition TEXT,
  purpose TEXT,
  link TEXT,
  two_fa TEXT,
  two_fa_code TEXT,
  friends TEXT,
  security TEXT,
  creation_date DATE,
  dob DATE,
  update_date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS gmail_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  password TEXT,
  country TEXT,
  condition TEXT,
  purpose TEXT,
  two_fa TEXT,
  two_fa_code TEXT,
  security TEXT,
  creation_date DATE,
  dob DATE,
  device TEXT,
  update_date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS locked_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gmail TEXT NOT NULL,
    password TEXT NOT NULL,
    slots JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Because this is a simple Admin DB, RLS is temporarily allowed for public/anon requests. 
-- For production, YOU MUST limit this properly if exposing to the public internet!
ALTER TABLE fb_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE locked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read/write for anon" ON fb_accounts FOR ALL USING (true);
CREATE POLICY "Enable read/write for anon" ON gmail_accounts FOR ALL USING (true);
CREATE POLICY "Enable read/write for anon" ON locked_accounts FOR ALL USING (true);
