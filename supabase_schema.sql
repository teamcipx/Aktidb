-- Add status column to existing tables if needed
ALTER TABLE fb_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';
ALTER TABLE gmail_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';
ALTER TABLE supabase_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';
ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';
ALTER TABLE special_fb_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';
ALTER TABLE special_gmail_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';
ALTER TABLE contact_numbers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';
ALTER TABLE brevo_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';
ALTER TABLE vercel_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';
ALTER TABLE imgbb_api_keys ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';

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

CREATE TABLE IF NOT EXISTS supabase_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  password TEXT,
  url TEXT,
  anon_key TEXT,
  db_pass TEXT,
  purpose TEXT,
  creation_date DATE,
  update_date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS github_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  username TEXT,
  password TEXT,
  two_fa TEXT,
  two_fa_code TEXT,
  purpose TEXT,
  profile_link TEXT,
  creation_date DATE,
  update_date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS special_fb_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  password TEXT,
  country TEXT,
  purpose TEXT,
  link TEXT,
  two_fa TEXT,
  two_fa_code TEXT,
  security TEXT,
  creation_date DATE,
  dob DATE,
  update_date DATE,
  note TEXT,
  recovery_email TEXT,
  recovery_phone TEXT,
  mother_name TEXT,
  primary_device TEXT,
  primary_location TEXT,
  master_password TEXT,
  secret_question TEXT,
  secret_answer TEXT,
  nid_number TEXT,
  pass_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS special_gmail_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  password TEXT,
  country TEXT,
  purpose TEXT,
  two_fa TEXT,
  two_fa_code TEXT,
  security TEXT,
  creation_date DATE,
  dob DATE,
  device TEXT,
  update_date DATE,
  note TEXT,
  recovery_email TEXT,
  recovery_phone TEXT,
  first_channel_name TEXT,
  primary_device TEXT,
  primary_location TEXT,
  master_password TEXT,
  secret_question TEXT,
  secret_answer TEXT,
  nid_number TEXT,
  pass_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  organization TEXT,
  address TEXT,
  group_name TEXT,
  purpose TEXT,
  creation_date DATE,
  update_date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Because this is a simple Admin DB, RLS is temporarily allowed for public/anon requests. 
-- For production, YOU MUST limit this properly if exposing to the public internet!
ALTER TABLE fb_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE locked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supabase_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_fb_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_gmail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read/write for anon" ON fb_accounts;
CREATE POLICY "Enable read/write for anon" ON fb_accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read/write for anon" ON gmail_accounts;
CREATE POLICY "Enable read/write for anon" ON gmail_accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read/write for anon" ON locked_accounts;
CREATE POLICY "Enable read/write for anon" ON locked_accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read/write for anon" ON supabase_accounts;
CREATE POLICY "Enable read/write for anon" ON supabase_accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read/write for anon" ON github_accounts;
CREATE POLICY "Enable read/write for anon" ON github_accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read/write for anon" ON special_fb_accounts;
CREATE POLICY "Enable read/write for anon" ON special_fb_accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read/write for anon" ON special_gmail_accounts;
CREATE POLICY "Enable read/write for anon" ON special_gmail_accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read/write for anon" ON contact_numbers;
CREATE POLICY "Enable read/write for anon" ON contact_numbers FOR ALL USING (true);


CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for anon" ON todos;
CREATE POLICY "Enable read/write for anon" ON todos FOR ALL USING (true);


CREATE TABLE IF NOT EXISTS brevo_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  password TEXT,
  api_key TEXT,
  smtp_key TEXT,
  purpose TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE brevo_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for anon" ON brevo_accounts;
CREATE POLICY "Enable read/write for anon" ON brevo_accounts FOR ALL USING (true);


CREATE TABLE IF NOT EXISTS vercel_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  password TEXT,
  token TEXT,
  team_id TEXT,
  purpose TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE vercel_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for anon" ON vercel_accounts;
CREATE POLICY "Enable read/write for anon" ON vercel_accounts FOR ALL USING (true);


CREATE TABLE IF NOT EXISTS imgbb_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'Uncompleted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE imgbb_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for anon" ON imgbb_api_keys;
CREATE POLICY "Enable read/write for anon" ON imgbb_api_keys FOR ALL USING (true);

-- FreeImage.host API Keys Table
CREATE TABLE IF NOT EXISTS freeimg_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'Uncompleted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE freeimg_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for anon" ON freeimg_api_keys;
CREATE POLICY "Enable read/write for anon" ON freeimg_api_keys FOR ALL USING (true);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for anon" ON activity_logs;
CREATE POLICY "Enable read/write for anon" ON activity_logs FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  link TEXT,
  brevo_account TEXT,
  github_repo TEXT,
  vercel_account TEXT,
  supabase_details TEXT,
  ai_studio_details TEXT,
  admin_email TEXT,
  admin_password TEXT,
  purpose TEXT,
  status TEXT DEFAULT 'Uncompleted',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Uncompleted';

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for anon" ON projects;
CREATE POLICY "Enable read/write for anon" ON projects FOR ALL USING (true);



