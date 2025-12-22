export const EXPIRATION_HOURS = 24;
export const ADMIN_CAN_GENERATE_ROLES = new Set(['admin', 'owner', 'dev']);
export const SELF_CAN_GENERATE_ROLES = new Set(['admin', 'owner', 'dev']);
export const ALLOWED_MODULES = new Set(['invoices', 'accountsReceivable']);
export const PIN_ROTATION_SCHEDULE = '0 3 * * *';
export const PIN_ROTATION_TIMEZONE = 'America/Santo_Domingo';
export const SYSTEM_ACTOR = Object.freeze({
  uid: 'system-pin-rotator',
  name: 'Rotador Automático de PIN',
  role: 'system',
});
