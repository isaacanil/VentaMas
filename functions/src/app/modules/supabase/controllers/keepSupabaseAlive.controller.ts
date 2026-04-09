// functions/src/modules/keepAlive/controllers/keepAlive.controller.ts

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { keepAliveLogic } from '../services/keepSupabaseAlive.service.js';
import { logger } from 'firebase-functions';

/**
 * Función programada que se ejecuta cada 5 horas (o según la expresión de cron).
 */
export const keepSupabaseAlive = onSchedule(
  {
    schedule: '0 */12 * * *',
    timeZone: 'America/Santo_Domingo',
    secrets: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE'],
  },
  async (event) => {
    logger.info(
      `[keepSupabaseAlive] Ejecutando... Trigger: ${event.scheduleTime}`,
    );
    await keepAliveLogic();
  },
);
