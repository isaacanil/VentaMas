import { HttpsError } from 'firebase-functions/v2/https';

import { cardnetProviderAdapter } from '../adapters/cardnet.provider.js';
import { manualProviderAdapter } from '../adapters/manual.provider.js';
import { toCleanString } from '../utils/billingCommon.util.js';

const isCardnetDisabled = () =>
  String(process.env.BILLING_DISABLE_CARDNET || 'false').toLowerCase() ===
  'true';

const PROVIDER_ADAPTERS = new Map([
  ['cardnet', cardnetProviderAdapter],
  ['manual', manualProviderAdapter],
]);

export const resolvePaymentProviderAdapter = (rawProviderId) => {
  const providerId = toCleanString(rawProviderId)?.toLowerCase() || 'cardnet';
  if (providerId === 'cardnet' && isCardnetDisabled()) {
    throw new HttpsError(
      'unimplemented',
      'Proveedor de pago cardnet deshabilitado por configuración',
    );
  }
  const adapter = PROVIDER_ADAPTERS.get(providerId);
  if (!adapter) {
    throw new HttpsError(
      'unimplemented',
      `Proveedor de pago ${providerId} no implementado`,
    );
  }
  return adapter;
};

export const getImplementedProviderIds = () =>
  Array.from(PROVIDER_ADAPTERS.entries())
    .filter(([providerId, adapter]) => {
      if (!adapter) return false;
      return providerId === 'cardnet' && !isCardnetDisabled();
    })
    .map(([providerId]) => providerId);
