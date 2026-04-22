import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fdexujgrvnjprdzlvayo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZXh1amdydm5qcHJkemx2YXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTUyNjAsImV4cCI6MjA5MjQzMTI2MH0.-8caIFl8Jpjzy_JA8KCbIYC4bTFvVbJBW79V9iJHa2o';

export const supabase = createClient(supabaseUrl, supabaseKey);
