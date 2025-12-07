import { createClient } from '@supabase/supabase-js';

// Usamos variables de entorno o strings vacíos para evitar errores si no están configuradas aún
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);