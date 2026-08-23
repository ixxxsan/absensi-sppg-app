import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client untuk frontend (hanya bisa public upload/read jika RLS disetel)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
