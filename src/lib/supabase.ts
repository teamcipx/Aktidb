import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rrkxxtwlepcepzqvsguo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3h4dHdsZXBjZXB6cXZzZ3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzEwNDQsImV4cCI6MjA5Mjg0NzA0NH0.QQQy699UnXRZxAcspPbQCrleawlr4HZ2Eo8VVvA89v8';

export const supabase = createClient(supabaseUrl, supabaseKey);
