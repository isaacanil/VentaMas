import { URL } from 'node:url';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  asRecord,
  toCleanString,
  toFiniteNumber,
} from '../utils/billingCommon.util.js';

const DEFAULT_CHECKOUT_BASE_URL = 'https://ventamax.web.app/checkout';
const DEFAULT_PORTAL_BASE_URL = 'https://ventamax.web.app/portal';
const DEFAULT_SUCCESS_RETURN_PATH = '/billing-return.html';
const DEFAULT_CARDNET_API_BASE_URL = 'https://labservicios.cardnet.com.do';
const DEFAULT_CARDNET_AUTHORIZE_URL =
  'https://labservicios.cardnet.com.do/authorize';
const DEFAULT_CARDNET_MERCHANT_ID = '349041263';
const DEFAULT_CARDNET_TERMINAL_ID = '77777777';
const DEFAULT_CARDNET_TRANSACTION_TYPE = '01';
const DEFAULT_CARDNET_ACQUIRING_INSTITUTION_CODE = '000001';
const DEFAULT_CARDNET_PAGE_LANGUAGE = 'ESP';
const DEFAULT_CARDNET_MERCHANT_NAME = 'VENTAMAS';
const DEFAULT_CARDNET_MERCHANT_TYPE = 'RT';
const CARDNET_CURRENCY_CODE_BY_ISO = {
  DOP: '214',
  USD: '840',
};
const APPROVED_STATUS_TOKENS = [
  'approved',
  'success',
  'successful',
  'authorized',
  'paid',
  'completed',
];
const FAILED_STATUS_TOKENS = [
  'declined',
  'denied',
  'failed',
  'error',
  'rejected',
];

const resolveBaseUrl = (envValue, fallback) =>
  toCleanString(envValue) || fallback;

const resolveCheckoutBaseUrl = (returnUrl) => {
  const envBaseUrl = toCleanString(process.env.BILLING_CARDNET_CHECKOUT_BASE_URL);
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

const resolveCheckoutReturnUrl = ({
  baseReturnUrl,
  result,
  orderNumber,
}) => {
  const url = new URL(baseReturnUrl);
  url.pathname = DEFAULT_SUCCESS_RETURN_PATH;
  url.search = '';
  url.searchParams.set('billingResult', result);
  url.searchParams.set('provider', 'cardnet');
  if (orderNumber) {
    url.searchParams.set('orderNumber', orderNumber);
  }
  return url.toString();
};

const getProviderMode = () => {
  const rawMode = toCleanString(process.env.BILLING_CARDNET_MODE);
  if (!rawMode) return 'sandbox';
  return rawMode.toLowerCase();
};

const resolveCardnetApiBaseUrl = () =>
  resolveBaseUrl(
    process.env.BILLING_CARDNET_API_BASE_URL,
    DEFAULT_CARDNET_API_BASE_URL,
  );

const resolveCardnetAuthorizeUrl = () =>
  resolveBaseUrl(
    process.env.BILLING_CARDNET_AUTHORIZE_URL,
    DEFAULT_CARDNET_AUTHORIZE_URL,
  );

const resolveCardnetMerchantId = () =>
  resolveBaseUrl(
    process.env.BILLING_CARDNET_MERCHANT_ID,
    DEFAULT_CARDNET_MERCHANT_ID,
  );

const resolveCardnetTerminalId = () =>
  resolveBaseUrl(
    process.env.BILLING_CARDNET_TERMINAL_ID,
    DEFAULT_CARDNET_TERMINAL_ID,
  );

const resolveCardnetTransactionType = () =>
  resolveBaseUrl(
    process.env.BILLING_CARDNET_TRANSACTION_TYPE,
    DEFAULT_CARDNET_TRANSACTION_TYPE,
  );

const resolveCardnetAcquiringInstitutionCode = () =>
  resolveBaseUrl(
    process.env.BILLING_CARDNET_ACQUIRING_INSTITUTION_CODE,
    DEFAULT_CARDNET_ACQUIRING_INSTITUTION_CODE,
  );

const resolveCardnetPageLanguage = () =>
  resolveBaseUrl(
    process.env.BILLING_CARDNET_PAGE_LANGUAGE,
    DEFAULT_CARDNET_PAGE_LANGUAGE,
  );

const resolveCardnetMerchantName = () =>
  resolveBaseUrl(
    process.env.BILLING_CARDNET_MERCHANT_NAME,
    DEFAULT_CARDNET_MERCHANT_NAME,
  );

const resolveCardnetMerchantType = () =>
  resolveBaseUrl(
    process.env.BILLING_CARDNET_MERCHANT_TYPE,
    DEFAULT_CARDNET_MERCHANT_TYPE,
  );

const resolveCurrencyCode = (currency) => {
  const normalizedCurrency = toCleanString(currency)?.toUpperCase() || 'DOP';
  return (
    CARDNET_CURRENCY_CODE_BY_ISO[normalizedCurrency] ||
    toCleanString(process.env.BILLING_CARDNET_DEFAULT_CURRENCY_CODE) ||
    CARDNET_CURRENCY_CODE_BY_ISO.DOP
  );
};

const resolveCheckoutAmount = (amount) => {
  const numericAmount = toFiniteNumber(amount, null);
  if (numericAmount == null || numericAmount <= 0) {
    return 1500;
  }
  return Number(numericAmount.toFixed(2));
};

const resolveSessionPayloadOverrides = () => {
  const rawOverrides = toCleanString(process.env.BILLING_CARDNET_SESSION_PAYLOAD_JSON);
  if (!rawOverrides) return {};
  try {
    return asRecord(JSON.parse(rawOverrides));
  } catch (error) {
    console.warn('Unable to parse BILLING_CARDNET_SESSION_PAYLOAD_JSON', {
      error: error instanceof Error ? error.message : error,
    });
    return {};
  }
};

const resolveSessionHeaders = () => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const rawHeaders = toCleanString(process.env.BILLING_CARDNET_SESSION_HEADERS_JSON);
  if (!rawHeaders) return baseHeaders;
  try {
    return {
      ...baseHeaders,
      ...asRecord(JSON.parse(rawHeaders)),
    };
  } catch (error) {
    console.warn('Unable to parse BILLING_CARDNET_SESSION_HEADERS_JSON', {
      error: error instanceof Error ? error.message : error,
    });
    return baseHeaders;
  }
};

const readJsonResponse = async (response) => {
  const rawText = await response.text();
  if (!rawText) return {};
  try {
    return JSON.parse(rawText);
  } catch (error) {
    return {
      rawText,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
};

const resolveNestedRecord = (value) => {
  const root = asRecord(value);
  if (Object.keys(root).length === 0) return root;
  const nested = asRecord(root.data);
  return Object.keys(nested).length ? nested : root;
};

const pickFirstString = (...values) => {
  for (const value of values) {
    const normalized = toCleanString(value);
    if (normalized) return normalized;
  }
  return null;
};

const pickFirstNumber = (...values) => {
  for (const value of values) {
    const normalized = toFiniteNumber(value, null);
    if (normalized != null) return normalized;
  }
  return null;
};

const normalizeGatewayAmount = ({
  gatewayAmount,
  fallbackAmount,
}) => {
  const resolvedGatewayAmount = pickFirstNumber(gatewayAmount);
  const resolvedFallbackAmount = pickFirstNumber(fallbackAmount);
  if (resolvedGatewayAmount == null) return resolvedFallbackAmount;
  if (
    resolvedFallbackAmount != null &&
    resolvedGatewayAmount >= 100 &&
    Math.abs(resolvedGatewayAmount / 100 - resolvedFallbackAmount) < 0.01
  ) {
    return Number((resolvedGatewayAmount / 100).toFixed(2));
  }
  return Number(resolvedGatewayAmount.toFixed(2));
};

const resolveVerificationStatus = ({
  approved,
  payload,
}) => {
  if (approved) return 'paid';

  const statusText = [
    payload.status,
    payload.state,
    payload.transactionStatus,
    payload.paymentStatus,
    payload.responseMessage,
    payload.description,
  ]
    .map((value) => toCleanString(value)?.toLowerCase() || '')
    .join(' ');

  if (statusText.includes('cancel')) return 'void';
  if (FAILED_STATUS_TOKENS.some((token) => statusText.includes(token))) {
    return 'failed';
  }
  return 'pending';
};

const resolveApprovedFlag = (payload) => {
  if (payload.approved === true) return true;
  const responseCode = pickFirstString(
    payload.responseCode,
    payload.ResponseCode,
    payload.authorizationResponseCode,
    payload.isoCode,
    payload.ISOCode,
  );
  if (responseCode === '00') return true;

  const statusText = [
    payload.status,
    payload.state,
    payload.transactionStatus,
    payload.paymentStatus,
    payload.responseMessage,
    payload.description,
  ]
    .map((value) => toCleanString(value)?.toLowerCase() || '')
    .join(' ');

  return APPROVED_STATUS_TOKENS.some((token) => statusText.includes(token));
};

const buildSessionPayload = ({
  merchantId,
  terminalId,
  orderNumber,
  amount,
  currencyCode,
  approvedUrl,
  cancelUrl,
  transactionType,
  acquiringInstitutionCode,
  merchantName,
  merchantType,
  pageLanguage,
}) => ({
  TransactionType: transactionType,
  CurrencyCode: currencyCode,
  AcquiringInstitutionCode: acquiringInstitutionCode,
  MerchantType: merchantType,
  MerchantNumber: merchantId,
  MerchantTerminal: terminalId,
  ReturnUrl: approvedUrl,
  CancelUrl: cancelUrl,
  PageLanguaje: pageLanguage,
  OrdenId: orderNumber,
  TransactionId: orderNumber,
  Tax: '0',
  MerchantName: merchantName,
  Amount: amount.toFixed(2),
  ...resolveSessionPayloadOverrides(),
});

const createCardnetSession = async ({
  apiBaseUrl,
  payload,
}) => {
  const response = await fetch(`${apiBaseUrl}/sessions`, {
    method: 'POST',
    headers: resolveSessionHeaders(),
    body: JSON.stringify(payload),
  });

  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new HttpsError(
      'failed-precondition',
      `CardNET session failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }

  return resolveNestedRecord(body);
};

const resolveVerifyUrl = (apiBaseUrl, sessionId, sessionKey) => {
  const envUrl = toCleanString(process.env.BILLING_CARDNET_VERIFY_URL);
  if (envUrl) {
    return envUrl.includes('{SESSION}')
      ? envUrl.replace('{SESSION}', sessionId)
      : envUrl;
  }
  const verifyUrl = new URL(`${apiBaseUrl}/sessions/${sessionId}`);
  if (sessionKey) {
    verifyUrl.searchParams.set('sk', sessionKey);
  }
  return verifyUrl.toString();
};

const verifyCardnetSession = async ({
  apiBaseUrl,
  sessionId,
  sessionKey,
}) => {
  const verifyUrl = resolveVerifyUrl(apiBaseUrl, sessionId, sessionKey);
  const headers = {
    Accept: 'application/json',
    'session-key': sessionKey,
  };

  let response = await fetch(verifyUrl, {
    method: 'GET',
    headers,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        SESSION: sessionId,
        session: sessionId,
      }),
    });
  }

  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new HttpsError(
      'failed-precondition',
      `CardNET verification failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }

  return resolveNestedRecord(body);
};

export const cardnetProviderAdapter = {
  providerId: 'cardnet',

  async createCheckoutSession({
    billingAccountId,
    businessId,
    returnUrl,
    planCode,
    actorUserId,
    currency = 'DOP',
    amount,
  }) {
    const checkoutBaseUrl = resolveCheckoutBaseUrl(returnUrl);
    const apiBaseUrl = resolveCardnetApiBaseUrl();
    const authorizeUrl = resolveCardnetAuthorizeUrl();
    const merchantId = resolveCardnetMerchantId();
    const terminalId = resolveCardnetTerminalId();
    const transactionType = resolveCardnetTransactionType();
    const acquiringInstitutionCode =
      resolveCardnetAcquiringInstitutionCode();
    const pageLanguage = resolveCardnetPageLanguage();
    const merchantName = resolveCardnetMerchantName();
    const merchantType = resolveCardnetMerchantType();
    const currencyCode = resolveCurrencyCode(currency);
    const numericAmount = resolveCheckoutAmount(amount);
    const orderNumber = `CN-${Date.now()}`;
    const baseReturnUrl = toCleanString(returnUrl) || DEFAULT_CHECKOUT_BASE_URL;
    const approvedUrl = resolveCheckoutReturnUrl({
      baseReturnUrl,
      result: 'success',
      orderNumber,
    });
    const declinedUrl = resolveCheckoutReturnUrl({
      baseReturnUrl,
      result: 'failed',
      orderNumber,
    });
    const cancelUrl = resolveCheckoutReturnUrl({
      baseReturnUrl,
      result: 'canceled',
      orderNumber,
    });

    const sessionPayload = buildSessionPayload({
      merchantId,
      terminalId,
      orderNumber,
      amount: numericAmount,
      currencyCode,
      approvedUrl,
      cancelUrl,
      transactionType,
      acquiringInstitutionCode,
      merchantName,
      merchantType,
      pageLanguage,
    });

    const sessionResponse = await createCardnetSession({
      apiBaseUrl,
      payload: sessionPayload,
    });

    const sessionId = pickFirstString(
      sessionResponse.SESSION,
      sessionResponse.session,
      sessionResponse.sessionId,
    );
    const sessionKey = pickFirstString(
      sessionResponse['session-key'],
      sessionResponse.sessionKey,
    );

    if (!sessionId || !sessionKey) {
      throw new HttpsError(
        'failed-precondition',
        `CardNET session response missing SESSION/session-key: ${JSON.stringify(sessionResponse)}`,
      );
    }

    const url = appendQueryParams(checkoutBaseUrl, {
      provider: 'cardnet',
      mode: getProviderMode(),
      SESSION: sessionId,
      authorizeUrl,
      orderNumber,
      returnUrl: toCleanString(returnUrl) || null,
    });

    return {
      url,
      checkoutSession: {
        orderNumber,
        amount: numericAmount,
        currency: toCleanString(currency) || 'DOP',
        currencyCode,
        gatewaySessionId: sessionId,
        gatewaySessionKey: sessionKey,
        authorizeUrl,
        apiBaseUrl,
        approvedUrl,
        declinedUrl,
        cancelUrl,
        mode: getProviderMode(),
        sessionExpiresAt: pickFirstString(
          sessionResponse.expiration,
          sessionResponse.expiresAt,
          sessionResponse.expireAt,
        ),
        metadata: {
          billingAccountId,
          businessId,
          actorUserId,
          merchantId,
          terminalId,
          transactionType,
          acquiringInstitutionCode,
          merchantType,
          merchantName,
          pageLanguage,
          requestedPlanCode: planCode,
        },
      },
    };
  },

  async createBillingPortalSession({
    billingAccountId,
    businessId,
    returnUrl,
    actorUserId,
  }) {
    const portalBaseUrl = resolveBaseUrl(
      process.env.BILLING_CARDNET_PORTAL_BASE_URL,
      DEFAULT_PORTAL_BASE_URL,
    );

    return appendQueryParams(portalBaseUrl, {
      provider: 'cardnet',
      mode: getProviderMode(),
      billingAccountId,
      businessId,
      actorUserId,
      returnUrl: toCleanString(returnUrl) || null,
    });
  },

  async verifyCheckoutSession({ checkoutSession }) {
    const sessionData = asRecord(checkoutSession);
    const apiBaseUrl =
      pickFirstString(sessionData.apiBaseUrl) || resolveCardnetApiBaseUrl();
    const sessionId = pickFirstString(
      sessionData.gatewaySessionId,
      sessionData.SESSION,
      sessionData.session,
    );
    const sessionKey = pickFirstString(
      sessionData.gatewaySessionKey,
      sessionData['session-key'],
      sessionData.sessionKey,
    );

    if (!sessionId || !sessionKey) {
      throw new HttpsError(
        'failed-precondition',
        'La sesión CardNET no tiene SESSION o session-key persistidos.',
      );
    }

    const verificationPayload = await verifyCardnetSession({
      apiBaseUrl,
      sessionId,
      sessionKey,
    });
    const approved = resolveApprovedFlag(verificationPayload);
    const status = resolveVerificationStatus({
      approved,
      payload: verificationPayload,
    });

    return {
      approved,
      status,
      amount: normalizeGatewayAmount({
        gatewayAmount: pickFirstNumber(
          verificationPayload.amount,
          verificationPayload.Amount,
          verificationPayload.total,
          verificationPayload.transactionAmount,
        ),
        fallbackAmount: pickFirstNumber(sessionData.amount),
      }),
      currency:
        pickFirstString(
          verificationPayload.currency,
          verificationPayload.Currency,
          sessionData.currency,
        ) || 'DOP',
      reference: pickFirstString(
        verificationPayload.authorizationCode,
        verificationPayload.authCode,
        verificationPayload.reference,
        verificationPayload.rrn,
        sessionId,
      ),
      sessionId,
      gatewayStatus: pickFirstString(
        verificationPayload.status,
        verificationPayload.state,
        verificationPayload.transactionStatus,
        verificationPayload.paymentStatus,
      ),
      responseCode: pickFirstString(
        verificationPayload.responseCode,
        verificationPayload.ResponseCode,
        verificationPayload.authorizationResponseCode,
      ),
      message: pickFirstString(
        verificationPayload.responseMessage,
        verificationPayload.description,
        verificationPayload.message,
      ),
      rawResult: verificationPayload,
    };
  },
};

export default cardnetProviderAdapter;




