import { createClient } from '@supabase/supabase-js';
import { defineSecret } from 'firebase-functions/params';

// Exportamos los Param para poder usarlos directamente en configuraciones si hiciera falta
export const SUPABASE_SERVICE_ROLE_KEY = defineSecret('SUPABASE_SERVICE_ROLE');
export const SUPABASE_URL = defineSecret('SUPABASE_URL');

// Lazy getters: llaman .value() solo en tiempo de ejecución (no durante el deploy)
export function getSupabaseUrl() {
    return SUPABASE_URL.value();
}

export function getSupabaseServiceRoleKey() {
    return SUPABASE_SERVICE_ROLE_KEY.value();
}

export function getSupabase() {
    return createClient(
        getSupabaseUrl(),
        getSupabaseServiceRoleKey()
    );
}
