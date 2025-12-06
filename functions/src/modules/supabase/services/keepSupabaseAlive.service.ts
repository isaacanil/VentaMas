// functions/src/modules/keepAlive/services/keepAlive.service.ts

import * as logger from 'firebase-functions/logger';
import { getSupabase } from '../../../core/config/supabaseConfig.js';

/**
 * Función que ejecuta la lógica de "keep alive" para Supabase.
 */
export async function keepAliveLogic(): Promise<void> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('rnc').select('*').limit(1);

    if (error) {
      logger.error('❌ Error al consultar Supabase:', error.message);
      return;
    }

    logger.info('✅ Consulta exitosa a Supabase:', data);
  } catch (err: any) {
    logger.error('❌ Excepción inesperada:', err.message);
  }
}
