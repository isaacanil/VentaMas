import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';

export const handleError = (
  error,
  fallbackMessage = 'Error procesando la solicitud de PIN',
) => {
  if (error instanceof HttpsError) throw error;
  logger.error('[pinAuth] Unhandled error', { error });
  throw new HttpsError('internal', fallbackMessage);
};
