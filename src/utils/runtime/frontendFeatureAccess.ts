export type FrontendFeatureKey =
  | 'userRegistration'
  | 'businessCreation'
  | 'subscriptionManagement'
  | 'invoiceTemplateV2Beta';

const RESTRICTED_PRODUCTION_HOSTS = new Set(['ventamax.web.app']);
const LOGIN_DEV_MODE_ENABLED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'ventamaxpos-staging.web.app',
]);

const resolveHostname = (): string | null => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname?.trim().toLowerCase();
  return hostname || null;
};

export const isRestrictedProductionHost = (
  hostname = resolveHostname(),
): boolean => Boolean(hostname && RESTRICTED_PRODUCTION_HOSTS.has(hostname));

export const isLoginDevModeEnabledHost = (
  hostname = resolveHostname(),
): boolean => Boolean(hostname && LOGIN_DEV_MODE_ENABLED_HOSTS.has(hostname));

export const isFrontendFeatureEnabled = (
  feature: FrontendFeatureKey,
  hostname = resolveHostname(),
): boolean => {
  if (feature === 'invoiceTemplateV2Beta') {
    return isLoginDevModeEnabledHost(hostname);
  }

  if (!isRestrictedProductionHost(hostname)) return true;

  switch (feature) {
    case 'userRegistration':
    case 'businessCreation':
    case 'subscriptionManagement':
      return false;
    default:
      return true;
  }
};

export const FRONTEND_FEATURE_SUPPORT_PATHS = {
  userRegistration: '/login',
  businessCreation: '/home',
  subscriptionManagement: '/home',
  invoiceTemplateV2Beta: '/home',
} as const;
