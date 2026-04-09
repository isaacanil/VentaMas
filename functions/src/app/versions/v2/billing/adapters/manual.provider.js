import { URL } from 'node:url';

import { toCleanString } from '../utils/billingCommon.util.js';

const DEFAULT_CHECKOUT_RETURN_URL =
  'https://ventamax.web.app/settings/account/subscription';
const DEFAULT_PORTAL_RETURN_URL =
  'https://ventamax.web.app/settings/account/subscription/billing';

const appendQueryParams = (baseUrl, params) => {
  const url = new URL(baseUrl);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value == null) return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

export const manualProviderAdapter = {
  providerId: 'manual',
  async createCheckoutSession({
    billingAccountId,
    businessId,
    returnUrl,
    planCode,
    actorUserId,
    currency = 'DOP',
  }) {
    const targetUrl = toCleanString(returnUrl) || DEFAULT_CHECKOUT_RETURN_URL;

    return appendQueryParams(targetUrl, {
      billingMock: '1',
      provider: 'manual',
      billingAccountId,
      businessId,
      actorUserId,
      planCode,
      currency,
    });
  },

  async createBillingPortalSession({
    billingAccountId,
    businessId,
    returnUrl,
    actorUserId,
  }) {
    const targetUrl = toCleanString(returnUrl) || DEFAULT_PORTAL_RETURN_URL;

    return appendQueryParams(targetUrl, {
      billingPortalMock: '1',
      provider: 'manual',
      billingAccountId,
      businessId,
      actorUserId,
    });
  },

  async mapWebhookEvent(rawEvent) {
    return {
      provider: 'manual',
      rawEvent,
    };
  },
};

export default manualProviderAdapter;
