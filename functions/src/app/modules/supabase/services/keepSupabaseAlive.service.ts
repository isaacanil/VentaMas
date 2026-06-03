// functions/src/modules/keepAlive/services/keepAlive.service.ts

import type { PostgrestError } from '@supabase/supabase-js';
import * as logger from 'firebase-functions/logger';
import { getSupabase } from '../../../core/config/supabaseConfig.js';

/**
 * Funcion que ejecuta la logica de "keep alive" para Supabase.
 */
export async function keepAliveLogic(): Promise<void> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('rnc').select('*').limit(1);

    if (error) {
      logger.error('Error al consultar Supabase:', error.message);
      return;
    }

    logger.info('Consulta exitosa a Supabase', {
      rowCount: Array.isArray(data) ? data.length : 0,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : ((err as PostgrestError | null)?.message ?? 'Error desconocido');
    logger.error('Excepcion inesperada:', message);
  }
}
