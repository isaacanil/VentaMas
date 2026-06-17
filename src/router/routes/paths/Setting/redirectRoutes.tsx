import { Navigate } from 'react-router-dom';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const {
  USERS,
  USERS_LIST,
  GENERAL_CONFIG_APP_INFO,
  GENERAL_CONFIG_BILLING,
  GENERAL_CONFIG_MODULES,
  GENERAL_CONFIG_BUSINESS,
  GENERAL_CONFIG_ACCOUNTING,
  GENERAL_CONFIG_EXCHANGE_RATES,
  GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
  GENERAL_CONFIG_INVENTORY,
  GENERAL_CONFIG_SUBSCRIPTION,
  GENERAL_CONFIG_SUBSCRIPTION_PLANS,
  GENERAL_CONFIG_SUBSCRIPTION_BILLING,
  ACCOUNT_SUBSCRIPTION,
  ACCOUNT_SUBSCRIPTION_MANAGE,
  ACCOUNT_SUBSCRIPTION_SUCCESS,
  ACCOUNT_SUBSCRIPTION_PLANS,
  ACCOUNT_SUBSCRIPTION_BILLING,
  ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS,
  ACCOUNT_SUBSCRIPTION_SETTINGS,
  GENERAL_CONFIG_TAX_RECEIPT,
  GENERAL_CONFIG_USERS,
  GENERAL_CONFIG_AUTHORIZATION,
} = ROUTES_NAME.SETTING_TERM;

type RedirectRoutePair = readonly [string, string];

const createRedirectRoutes = (
  routes: ReadonlyArray<RedirectRoutePair>,
): AppRoute[] =>
  routes.map(([path, to]) => ({
    path,
    element: <Navigate to={to} replace />,
  }));

const usersListRoute = `${USERS}/${USERS_LIST}`;

export const generalConfigRedirectRoutes = createRedirectRoutes([
  ['/settings/general-config', GENERAL_CONFIG_BILLING],
  ['/settings/general-config/', GENERAL_CONFIG_BILLING],
  ['/settings/general-config/modules', GENERAL_CONFIG_MODULES],
  ['/settings/general-config/billing', GENERAL_CONFIG_BILLING],
  ['/settings/general-config/accounting', GENERAL_CONFIG_ACCOUNTING],
  ['/settings/contabilidad', GENERAL_CONFIG_ACCOUNTING],
  ['/settings/contabilidad/tasa-cambio', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/settings/tasa-cambio', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/settings/accounting/tasa-cambio', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/settings/general-config/tasa-cambio', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/settings/general-config-tasa-cambio', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/settings/general-config/exchange-rates', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/settings/general-config-exchange-rates', GENERAL_CONFIG_EXCHANGE_RATES],
  [
    '/settings/contabilidad/catalogo',
    GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  ],
  [
    '/settings/accounting/catalogo',
    GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  ],
  [
    '/settings/contabilidad/perfiles-contables',
    GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
  ],
  [
    '/settings/accounting/perfiles-contables',
    GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
  ],
  ['/settings/general-config/contabilidad', GENERAL_CONFIG_ACCOUNTING],
  ['/settings/general-config/business', GENERAL_CONFIG_BUSINESS],
  ['/settings/general-config/inventory', GENERAL_CONFIG_INVENTORY],
  ['/settings/general-config/tax-receipt', GENERAL_CONFIG_TAX_RECEIPT],
  ['/settings/general-config/authorization', GENERAL_CONFIG_AUTHORIZATION],
  ['/settings/general-config/app-info', GENERAL_CONFIG_APP_INFO],
  ['/settings/general-config/users', usersListRoute],
  [GENERAL_CONFIG_USERS, usersListRoute],
  [`${GENERAL_CONFIG_USERS}/*`, usersListRoute],
  ['/settings/general-config/subscription', GENERAL_CONFIG_SUBSCRIPTION],
  [
    '/settings/general-config/subscription/plans',
    GENERAL_CONFIG_SUBSCRIPTION_PLANS,
  ],
  [
    '/settings/general-config/subscription/billing',
    GENERAL_CONFIG_SUBSCRIPTION_BILLING,
  ],
  [
    '/settings/general-config/subscription/blocked-preview',
    GENERAL_CONFIG_SUBSCRIPTION,
  ],
  ['/settings/general-config-billing', GENERAL_CONFIG_BILLING],
  ['/settings/general-config-accounting', GENERAL_CONFIG_ACCOUNTING],
  ['/settings/general-config-contabilidad', GENERAL_CONFIG_ACCOUNTING],
  ['/settings/general-config-business', GENERAL_CONFIG_BUSINESS],
  ['/settings/general-config-inventory', GENERAL_CONFIG_INVENTORY],
  ['/settings/general-config-tax-receipt', GENERAL_CONFIG_TAX_RECEIPT],
  ['/settings/general-config-authorization', GENERAL_CONFIG_AUTHORIZATION],
  ['/settings/general-config-app-info', GENERAL_CONFIG_APP_INFO],
  ['/settings/general-config-users', usersListRoute],
  ['/settings/general-config-subscription', GENERAL_CONFIG_SUBSCRIPTION],
  [
    '/settings/general-config-subscription-plans',
    GENERAL_CONFIG_SUBSCRIPTION_PLANS,
  ],
  [
    '/settings/general-config-subscription-billing',
    GENERAL_CONFIG_SUBSCRIPTION_BILLING,
  ],
  [
    '/settings/general-config-subscription-blocked-preview',
    GENERAL_CONFIG_SUBSCRIPTION,
  ],
  ['/general-config', GENERAL_CONFIG_BILLING],
  ['/general-config/', GENERAL_CONFIG_BILLING],
  ['/general-config/modules', GENERAL_CONFIG_MODULES],
  ['/general-config/billing', GENERAL_CONFIG_BILLING],
  ['/general-config/accounting', GENERAL_CONFIG_ACCOUNTING],
  ['/general-config/contabilidad', GENERAL_CONFIG_ACCOUNTING],
  ['/general-config/business', GENERAL_CONFIG_BUSINESS],
  ['/general-config/inventory', GENERAL_CONFIG_INVENTORY],
  ['/general-config/tax-receipt', GENERAL_CONFIG_TAX_RECEIPT],
  ['/general-config/tasa-cambio', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/general-config/exchange-rates', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/general-config/authorization', GENERAL_CONFIG_AUTHORIZATION],
  ['/general-config/app-info', GENERAL_CONFIG_APP_INFO],
  ['/general-config/users', usersListRoute],
  ['/general-config/subscription', GENERAL_CONFIG_SUBSCRIPTION],
  ['/general-config/subscription/plans', GENERAL_CONFIG_SUBSCRIPTION_PLANS],
  ['/general-config/subscription/billing', GENERAL_CONFIG_SUBSCRIPTION_BILLING],
  ['/general-config/subscription/blocked-preview', GENERAL_CONFIG_SUBSCRIPTION],
  ['/general-config-modules', GENERAL_CONFIG_MODULES],
  ['/general-config-billing', GENERAL_CONFIG_BILLING],
  ['/general-config-accounting', GENERAL_CONFIG_ACCOUNTING],
  ['/general-config-contabilidad', GENERAL_CONFIG_ACCOUNTING],
  ['/general-config-business', GENERAL_CONFIG_BUSINESS],
  ['/general-config-inventory', GENERAL_CONFIG_INVENTORY],
  ['/general-config-tax-receipt', GENERAL_CONFIG_TAX_RECEIPT],
  ['/general-config-tasa-cambio', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/general-config-exchange-rates', GENERAL_CONFIG_EXCHANGE_RATES],
  ['/general-config-authorization', GENERAL_CONFIG_AUTHORIZATION],
  ['/general-config-app-info', GENERAL_CONFIG_APP_INFO],
  ['/general-config-users', usersListRoute],
  ['/general-config-subscription', GENERAL_CONFIG_SUBSCRIPTION],
  ['/general-config-subscription-plans', GENERAL_CONFIG_SUBSCRIPTION_PLANS],
  ['/general-config-subscription-billing', GENERAL_CONFIG_SUBSCRIPTION_BILLING],
  ['/general-config-subscription-blocked-preview', GENERAL_CONFIG_SUBSCRIPTION],
  [ACCOUNT_SUBSCRIPTION, ACCOUNT_SUBSCRIPTION_MANAGE],
  ['/settings/subscription/manage', ACCOUNT_SUBSCRIPTION_MANAGE],
  ['/settings/subscription/success', ACCOUNT_SUBSCRIPTION_SUCCESS],
]);

export const accountSubscriptionRedirectRoutes = createRedirectRoutes([
  ['/settings/account/subscription', ACCOUNT_SUBSCRIPTION],
  ['/settings/account/subscription/plans', ACCOUNT_SUBSCRIPTION_PLANS],
  ['/settings/account/subscription/billing', ACCOUNT_SUBSCRIPTION_BILLING],
  [
    '/settings/account/subscription/payment-methods',
    ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS,
  ],
  ['/settings/account/subscription/settings', ACCOUNT_SUBSCRIPTION_SETTINGS],
  [
    '/settings/account/subscription/blocked-preview',
    ACCOUNT_SUBSCRIPTION_MANAGE,
  ],
  ['/account/subscription/manage', ACCOUNT_SUBSCRIPTION_MANAGE],
  ['/settings/account/subscription/manage', ACCOUNT_SUBSCRIPTION_MANAGE],
  ['/settings/account/subscription/success', ACCOUNT_SUBSCRIPTION_SUCCESS],
]);
