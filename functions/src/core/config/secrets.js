// functions/src/core/config/secrets.ts
import { defineSecret, defineString } from 'firebase-functions/params';

// Secrets (Secret Manager)
export const MAIL_USER = defineSecret('STOCK_ALERT_MAIL_USER');
export const MAIL_PASS = defineSecret('STOCK_ALERT_MAIL_PASS');

export const MAIL_SECRETS = [MAIL_USER, MAIL_PASS];

// Parametrizables no sensibles (opcionalmente podrían ser secrets también)
export const MAIL_SERVICE = defineString('STOCK_ALERT_MAIL_SERVICE', {
  default: '',
});
export const MAIL_HOST = defineString('STOCK_ALERT_MAIL_HOST', { default: '' });
export const MAIL_PORT = defineString('STOCK_ALERT_MAIL_PORT', { default: '' });
export const MAIL_SECURE = defineString('STOCK_ALERT_MAIL_SECURE', {
  default: '',
});
export const MAIL_FROM = defineString('STOCK_ALERT_MAIL_FROM', { default: '' });

/** Pooling opcional para nodemailer */
export const MAIL_POOL = defineString('STOCK_ALERT_MAIL_POOL', {
  default: 'false',
});
export const MAIL_MAX_CONN = defineString('STOCK_ALERT_MAIL_MAX_CONN', {
  default: '',
}); // número
export const MAIL_MAX_MSG = defineString('STOCK_ALERT_MAIL_MAX_MSG', {
  default: '',
}); // número

// Otros params del digest
export const DIGEST_CRON = defineString('STOCK_ALERT_DIGEST_CRON', {
  default: '50 14 * * *',
});
export const DIGEST_TZ = defineString('STOCK_ALERT_DIGEST_TZ', {
  default: 'America/Santo_Domingo',
});
export const ALLOWED_DOMAINS = defineString(
  'STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS',
  {
    default: '*',
  },
);

/** Flags y límites opcionales usados por el digest */
export const DIGEST_VERBOSE = defineString('DIGEST_VERBOSE', {
  default: 'false',
});
export const STOCK_ALERT_DEBUG = defineString('STOCK_ALERT_DEBUG', {
  default: 'false',
});
export const STOCK_ALERT_DRY_RUN = defineString('STOCK_ALERT_DRY_RUN', {
  default: 'false',
});
export const DIGEST_BUSINESS_LIMIT = defineString('DIGEST_BUSINESS_LIMIT', {
  default: '100',
});
export const DIGEST_BUSINESS_ORDER_FIELD = defineString(
  'DIGEST_BUSINESS_ORDER_FIELD',
  {
    default: 'business.createdAt',
  },
);
