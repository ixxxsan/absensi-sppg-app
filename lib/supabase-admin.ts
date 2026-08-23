import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client untuk backend (bypass RLS, hanya boleh dipakai di Server Action / API Route)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
