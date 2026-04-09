import { URL } from 'node:url';
import crypto from 'node:crypto';

import { toCleanString } from '../utils/billingCommon.util.js';

const DEFAULT_CHECKOUT_BASE_URL = 'https://ventamax.web.app/checkout';
const DEFAULT_PORTAL_BASE_URL = 'https://ventamax.web.app/portal';
const DEFAULT_SUCCESS_RETURN_PATH = '/billing-return.html';
const DEFAULT_WEBHOOK_RESPONSE_URL =
  'https://us-central1-ventamaxpos.cloudfunctions.net/azulWebhookAuth2';

const resolveBaseUrl = (envValue, fallback) =>
  toCleanString(envValue) || fallback;

const resolveCheckoutBaseUrl = (returnUrl) => {
  const envBaseUrl = toCleanString(process.env.BILLING_AZUL_CHECKOUT_BASE_URL);
  if (envBaseUrl) return envBaseUrl;

  const normalizedReturnUrl = toCleanString(returnUrl);
  if (!normalizedReturnUrl) return DEFAULT_CHECKOUT_BASE_URL;

  try {
    const url = new URL(normalizedReturnUrl);
    url.pathname = '/checkout';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return DEFAULT_CHECKOUT_BASE_URL;
  }
};

const appendQueryParams = (baseUrl, params) => {
  const url = new URL(baseUrl);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value == null) return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const appendCheckoutResultToReturnUrl = (baseReturnUrl, result) =>
  appendQueryParams(baseReturnUrl, {
    billingResult: result,
    provider: 'azul',
  });

const resolveApprovedReturnUrl = (baseReturnUrl) => {
  const approvedUrl = new URL(baseReturnUrl);
  approvedUrl.pathname = DEFAULT_SUCCESS_RETURN_PATH;
  approvedUrl.search = '';
  return approvedUrl.toString();
};

const getProviderMode = () => {
  const rawMode = toCleanString(process.env.BILLING_AZUL_MODE);
  if (!rawMode) return 'sandbox';
  return rawMode.toLowerCase();
};

const generateAzulAuthHash = (params) => {
  const merchantId = toCleanString(process.env.BILLING_AZUL_MERCHANT_ID) || '';
  const merchantName =
    toCleanString(process.env.BILLING_AZUL_MERCHANT_NAME) || '';
  const merchantType =
    toCleanString(process.env.BILLING_AZUL_MERCHANT_TYPE) || '';
  const authKey = toCleanString(process.env.BILLING_AZUL_AUTH_KEY) || '';

  const {
    CurrencyCode = '$',
    OrderNumber = '',
    Amount = '',
    ITBIS = '000',
    ApprovedUrl = '',
    DeclinedUrl = '',
    CancelUrl = '',
    ResponseUrl = '',
    UseCustomField1 = '0',
    CustomField1 = '',
    UseCustomField2 = '0',
    CustomField2 = '',
  } = params;

  const stringToHash = `${merchantId}${merchantName}${merchantType}${CurrencyCode}${OrderNumber}${Amount}${ITBIS}${ApprovedUrl}${DeclinedUrl}${CancelUrl}${ResponseUrl}${UseCustomField1}${CustomField1}${UseCustomField2}${CustomField2}`;

  return crypto
    .createHmac('sha512', authKey)
    .update(stringToHash)
    .digest('hex');
};

export const azulProviderAdapter = {
  providerId: 'azul',
  async createCheckoutSession({
    billingAccountId,
    businessId,
    returnUrl,
    planCode,
    actorUserId,
    currency = 'DOP',
  }) {
    const checkoutBaseUrl = resolveCheckoutBaseUrl(returnUrl);
    const merchantId =
      toCleanString(process.env.BILLING_AZUL_MERCHANT_ID) || '';
    const merchantName =
      toCleanString(process.env.BILLING_AZUL_MERCHANT_NAME) || '';
    const merchantType =
      toCleanString(process.env.BILLING_AZUL_MERCHANT_TYPE) || '';

    const orderNumber = `ORD-${Date.now()}`;
    const amountStr = '150000'; // TODO: Dynamically fetch Amount from plan catalog
    const itbisStr = '000'; // 0 ITBIS for now
    const currencyCode = currency === 'DOP' ? '$' : 'US$';

    const baseReturnUrl = toCleanString(returnUrl) || DEFAULT_CHECKOUT_BASE_URL;
    const approvedUrl = appendCheckoutResultToReturnUrl(
      resolveApprovedReturnUrl(baseReturnUrl),
      'success',
    );
    const declinedUrl = appendCheckoutResultToReturnUrl(
      baseReturnUrl,
      'failed',
    );
    const cancelUrl = appendCheckoutResultToReturnUrl(
      baseReturnUrl,
      'canceled',
    );
    const responseUrl = resolveBaseUrl(
      process.env.BILLING_AZUL_RESPONSE_URL,
      DEFAULT_WEBHOOK_RESPONSE_URL,
    );
    const useCustomField1 = '1';
    const useCustomField2 = '1';

    const auth1Hash = generateAzulAuthHash({
      CurrencyCode: currencyCode,
      OrderNumber: orderNumber,
      Amount: amountStr,
      ITBIS: itbisStr,
      ApprovedUrl: approvedUrl,
      DeclinedUrl: declinedUrl,
      CancelUrl: cancelUrl,
      ResponseUrl: responseUrl,
      UseCustomField1: useCustomField1,
      CustomField1: billingAccountId,
      UseCustomField2: useCustomField2,
      CustomField2: businessId,
    });

    return appendQueryParams(checkoutBaseUrl, {
      provider: 'azul',
      mode: getProviderMode(),
      billingAccountId,
      businessId,
      actorUserId,
      planCode,
      currency,
      OrderNumber: orderNumber,
      Amount: amountStr,
      AuthHash: auth1Hash,
      MerchantId: merchantId,
      MerchantName: merchantName,
      MerchantType: merchantType,
      CurrencyCode: currencyCode,
      ITBIS: itbisStr,
      ApprovedUrl: approvedUrl,
      DeclinedUrl: declinedUrl,
      CancelUrl: cancelUrl,
      ResponseUrl: responseUrl,
      UseCustomField1: useCustomField1,
      CustomField1: billingAccountId,
      UseCustomField2: useCustomField2,
      CustomField2: businessId,
      returnUrl: toCleanString(returnUrl) || null,
    });
  },

  async createBillingPortalSession({
    billingAccountId,
    businessId,
    returnUrl,
    actorUserId,
  }) {
    const portalBaseUrl = resolveBaseUrl(
      process.env.BILLING_AZUL_PORTAL_BASE_URL,
      DEFAULT_PORTAL_BASE_URL,
    );

    return appendQueryParams(portalBaseUrl, {
      provider: 'azul',
      mode: getProviderMode(),
      billingAccountId,
      businessId,
      actorUserId,
      returnUrl: toCleanString(returnUrl) || null,
    });
  },

  async mapWebhookEvent(rawEvent) {
    return {
      provider: 'azul',
      rawEvent,
    };
  },
};

export default azulProviderAdapter;
