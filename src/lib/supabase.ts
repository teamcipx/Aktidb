import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vlnhyhiegtbgxsziwsyk.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbmh5aGllZ3RiZ3hzeml3c3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0Njk0NzcsImV4cCI6MjA5NDA0NTQ3N30.ZRjuDPELFubnk_b_q7VEKSuvYxs_acD4-Dt6Q83RR-0';

export const supabase = createClient(supabaseUrl, supabaseKey);
