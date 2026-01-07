import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://safxuhklxqxkcbvvgjgi.supabase.co'; // Tu URL de Supabase
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY; // Configura tu clave en .env
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
