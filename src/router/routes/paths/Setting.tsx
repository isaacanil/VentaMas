import BusinessFeatureRouteGate from '@/components/availability/BusinessFeatureRouteGate';
import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Navigate } from 'react-router-dom';

import FrontendFeatureRouteGate from '@/components/availability/FrontendFeatureRouteGate';
import { getRelativePath } from '@/router/routes/getConfigRoute';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';
import type { JSX } from 'react';

const AuthorizationFlowConfig = lazy(
  () =>
    import('@/modules/settings/components/GeneralConfig/configs/AuthorizationFlowConfig'),
);
const BillingConfig = lazy(
  () =>
    import('@/modules/settings/components/GeneralConfig/configs/BillingConfig'),
);
const ModulesConfig = lazy(
  () =>
    import('@/modules/settings/components/GeneralConfig/configs/ModulesConfig/ModulesConfig'),
);
const AccountingConfig = lazy(
  () =>
    import('@/modules/settings/components/GeneralConfig/configs/AccountingConfig/AccountingConfig'),
);
const SubscriptionConfig = lazy(
  () =>
    import('@/modules/settings/components/GeneralConfig/configs/SubscriptionConfig'),
);
const SubscriptionPlansPage = lazy(
  () => import('@/modules/settings/pages/subscription/SubscriptionPlansPage'),
);
const SubscriptionLayout = lazy(
  () => import('@/modules/settings/pages/subscription/SubscriptionLayout'),
);
const SubscriptionBillingPage = lazy(
  () => import('@/modules/settings/pages/subscription/SubscriptionBillingPage'),
);
const SubscriptionPaymentMethodPage = lazy(
  () =>
    import('@/modules/settings/pages/subscription/SubscriptionPaymentMethodPage'),
);
const SubscriptionOverviewPage = lazy(
  () =>
    import('@/modules/settings/pages/subscription/SubscriptionOverviewPage'),
);
const SubscriptionSettingsPage = lazy(
  () =>
    import('@/modules/settings/pages/subscription/SubscriptionSettingsPage'),
);
const SubscriptionSuccessPage = lazy(
  () => import('@/modules/settings/pages/subscription/SubscriptionSuccessPage'),
);
const InventoryConfig = lazy(
  () =>
    import('@/modules/settings/components/GeneralConfig/configs/InventoryConfig'),
);
const GeneralConfig = lazy(
  () => import('@/modules/settings/components/GeneralConfig/GeneralConfig'),
);
const SwitchBusiness = lazy(
  () => import('@/modules/dev/pages/dev/SwitchBusiness'),
);
const AppInfo = lazy(
  () => import('@/modules/settings/pages/setting/subPage/AppInfo/AppInfo'),
);
const BusinessCreatePage = lazy(
  () =>
    import('@/modules/settings/pages/setting/subPage/BusinessEditor/BusinessCreatePage'),
);
const BusinessEditPage = lazy(
  () =>
    import('@/modules/settings/pages/setting/subPage/BusinessEditor/BusinessEditPage'),
);
const TaxReceiptSetting = lazy(() =>
  import('@/modules/settings/pages/setting/subPage/TaxReceipts/TaxReceIptSetting').then(
    (module) => ({ default: module.TaxReceiptSetting }),
  ),
);
const UserList = lazy(() =>
  import('@/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList').then(
    (module) => ({ default: module.UserList }),
  ),
);
const UserActivity = lazy(() =>
  import('@/modules/settings/pages/setting/subPage/Users/UserActivity').then(
    (module) => ({ default: module.UserActivity }),
  ),
);
const UserAdmin = lazy(() =>
  import('@/modules/settings/pages/setting/subPage/Users/UserAdmin').then(
    (module) => ({ default: module.UserAdmin }),
  ),
);
const UsersLandingRedirect = lazy(() =>
  import('@/modules/settings/pages/setting/subPage/Users/UserAdmin').then(
    (module) => ({ default: module.UsersLandingRedirect }),
  ),
);
const UserSessionLogs = lazy(() =>
  import('@/modules/settings/pages/setting/subPage/Users/UserSessionLogs').then(
    (module) => ({ default: module.UserSessionLogs }),
  ),
);

const {
  USERS,
  USERS_LIST,
  USERS_SESSION_LOGS,
  USERS_ACTIVITY_DETAIL,
  SETTING,
  GENERAL_CONFIG_APP_INFO,
  GENERAL_CONFIG_BILLING,
  GENERAL_CONFIG_MODULES,
  GENERAL_CONFIG_BUSINESS,
  GENERAL_CONFIG_ACCOUNTING,
  GENERAL_CONFIG_EXCHANGE_RATES,
  GENERAL_CONFIG_ACCOUNTING_BANK_ACCOUNTS,
  GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  GENERAL_CONFIG_ACCOUNTING_EXCHANGE_RATES,
  GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
  GENERAL_CONFIG_INVENTORY,
  GENERAL_CONFIG_SUBSCRIPTION,
  GENERAL_CONFIG_SUBSCRIPTION_PLANS,
  GENERAL_CONFIG_SUBSCRIPTION_BILLING,
  GENERAL_CONFIG_SUBSCRIPTION_BLOCKED,
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

const { CREATE_BUSINESS } = ROUTES_NAME.DEV_VIEW_TERM;

const generalConfigBillingRelativePath = getRelativePath(
  GENERAL_CONFIG_BILLING,
  SETTING,
);
const withAccountingSettingsGate = (element: JSX.Element) => (
  <BusinessFeatureRouteGate
    feature="accounting"
    fallbackTo={GENERAL_CONFIG_BILLING}
  >
    {element}
  </BusinessFeatureRouteGate>
);

const Routes: AppRoute[] = [
  {
    path: USERS,
    element: <UserAdmin />,
    name: USERS,
    children: [
      {
        index: true,
        element: <UsersLandingRedirect />,
      },
      {
        path: USERS_LIST,
        element: <UserList />,
      },
      {
        path: USERS_SESSION_LOGS,
        element: <UserSessionLogs />,
      },
      {
        path: USERS_ACTIVITY_DETAIL,
        element: <UserActivity />,
      },
      {
        path: '*',
        element: <UsersLandingRedirect />,
      },
    ],
  },
  {
    path: SETTING,
    element: <GeneralConfig />,
    children: [
      {
        index: true,
        element: <Navigate to={generalConfigBillingRelativePath} replace />,
      },
      {
        path: getRelativePath(GENERAL_CONFIG_MODULES, SETTING),
        element: <ModulesConfig />,
      },
      {
        path: generalConfigBillingRelativePath,
        element: <BillingConfig />,
      },
      {
        path: getRelativePath(GENERAL_CONFIG_EXCHANGE_RATES, SETTING),
        element: withAccountingSettingsGate(<AccountingConfig />),
      },
      {
        path: getRelativePath(GENERAL_CONFIG_ACCOUNTING_EXCHANGE_RATES, SETTING),
        element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
      },
      {
        path: `${getRelativePath(GENERAL_CONFIG_ACCOUNTING, SETTING)}/*`,
        element: withAccountingSettingsGate(<AccountingConfig />),
      },
      {
        path: getRelativePath(GENERAL_CONFIG_SUBSCRIPTION, SETTING),
        element: (
          <FrontendFeatureRouteGate feature="subscriptionManagement">
            <SubscriptionConfig />
          </FrontendFeatureRouteGate>
        ),
      },
      {
        path: getRelativePath(GENERAL_CONFIG_SUBSCRIPTION_PLANS, SETTING),
        element: (
          <FrontendFeatureRouteGate feature="subscriptionManagement">
            <SubscriptionConfig />
          </FrontendFeatureRouteGate>
        ),
      },
      {
        path: getRelativePath(GENERAL_CONFIG_SUBSCRIPTION_BILLING, SETTING),
        element: (
          <FrontendFeatureRouteGate feature="subscriptionManagement">
            <SubscriptionConfig />
          </FrontendFeatureRouteGate>
        ),
      },
      {
        path: getRelativePath(GENERAL_CONFIG_SUBSCRIPTION_BLOCKED, SETTING),
        element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION} replace />,
      },
      {
        path: getRelativePath(GENERAL_CONFIG_BUSINESS, SETTING),
        element: <BusinessEditPage />,
      },
      {
        path: getRelativePath(GENERAL_CONFIG_INVENTORY, SETTING),
        element: <InventoryConfig />,
      },
      {
        path: getRelativePath(GENERAL_CONFIG_TAX_RECEIPT, SETTING),
        element: <TaxReceiptSetting />,
      },
      {
        path: getRelativePath(GENERAL_CONFIG_AUTHORIZATION, SETTING),
        element: <AuthorizationFlowConfig />,
      },
      {
        path: getRelativePath(GENERAL_CONFIG_APP_INFO, SETTING),
        element: <AppInfo />,
      },
    ],
  },
  {
    path: '/settings/general-config',
    element: <Navigate to={GENERAL_CONFIG_BILLING} replace />,
  },
  {
    path: '/settings/general-config/',
    element: <Navigate to={GENERAL_CONFIG_BILLING} replace />,
  },
  {
    path: '/settings/general-config/modules',
    element: <Navigate to={GENERAL_CONFIG_MODULES} replace />,
  },
  {
    path: '/settings/general-config/billing',
    element: <Navigate to={GENERAL_CONFIG_BILLING} replace />,
  },
  {
    path: '/settings/modules',
    element: <Navigate to={GENERAL_CONFIG_MODULES} replace />,
  },
  {
    path: '/settings/general-config/accounting',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING} replace />,
  },
  {
    path: '/settings/contabilidad',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING} replace />,
  },
  {
    path: '/settings/contabilidad/tasa-cambio',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/settings/tasa-cambio',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/settings/accounting/tasa-cambio',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/settings/general-config/tasa-cambio',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/settings/general-config-tasa-cambio',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/settings/general-config/exchange-rates',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/settings/general-config-exchange-rates',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/settings/contabilidad/cuentas-bancarias',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING_BANK_ACCOUNTS} replace />,
  },
  {
    path: '/settings/accounting/cuentas-bancarias',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING_BANK_ACCOUNTS} replace />,
  },
  {
    path: '/settings/contabilidad/catalogo',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS} replace />,
  },
  {
    path: '/settings/accounting/catalogo',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS} replace />,
  },
  {
    path: '/settings/contabilidad/perfiles-contables',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES} replace />,
  },
  {
    path: '/settings/accounting/perfiles-contables',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES} replace />,
  },
  {
    path: '/settings/general-config/contabilidad',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING} replace />,
  },
  {
    path: '/settings/general-config/business',
    element: <Navigate to={GENERAL_CONFIG_BUSINESS} replace />,
  },
  {
    path: '/settings/general-config/inventory',
    element: <Navigate to={GENERAL_CONFIG_INVENTORY} replace />,
  },
  {
    path: '/settings/general-config/tax-receipt',
    element: <Navigate to={GENERAL_CONFIG_TAX_RECEIPT} replace />,
  },
  {
    path: '/settings/general-config/authorization',
    element: <Navigate to={GENERAL_CONFIG_AUTHORIZATION} replace />,
  },
  {
    path: '/settings/general-config/app-info',
    element: <Navigate to={GENERAL_CONFIG_APP_INFO} replace />,
  },
  {
    path: '/settings/general-config/users',
    element: <Navigate to={`${USERS}/${USERS_LIST}`} replace />,
  },
  {
    path: GENERAL_CONFIG_USERS,
    element: <Navigate to={`${USERS}/${USERS_LIST}`} replace />,
  },
  {
    path: `${GENERAL_CONFIG_USERS}/*`,
    element: <Navigate to={`${USERS}/${USERS_LIST}`} replace />,
  },
  {
    path: '/settings/general-config/subscription',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION} replace />,
  },
  {
    path: '/settings/general-config/subscription/plans',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION_PLANS} replace />,
  },
  {
    path: '/settings/general-config/subscription/billing',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION_BILLING} replace />,
  },
  {
    path: '/settings/general-config/subscription/blocked-preview',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION} replace />,
  },
  {
    path: '/settings/general-config-billing',
    element: <Navigate to={GENERAL_CONFIG_BILLING} replace />,
  },
  {
    path: '/settings/general-config-accounting',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING} replace />,
  },
  {
    path: '/settings/general-config-contabilidad',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING} replace />,
  },
  {
    path: '/settings/general-config-business',
    element: <Navigate to={GENERAL_CONFIG_BUSINESS} replace />,
  },
  {
    path: '/settings/general-config-inventory',
    element: <Navigate to={GENERAL_CONFIG_INVENTORY} replace />,
  },
  {
    path: '/settings/general-config-tax-receipt',
    element: <Navigate to={GENERAL_CONFIG_TAX_RECEIPT} replace />,
  },
  {
    path: '/settings/general-config-authorization',
    element: <Navigate to={GENERAL_CONFIG_AUTHORIZATION} replace />,
  },
  {
    path: '/settings/general-config-app-info',
    element: <Navigate to={GENERAL_CONFIG_APP_INFO} replace />,
  },
  {
    path: '/settings/general-config-users',
    element: <Navigate to={`${USERS}/${USERS_LIST}`} replace />,
  },
  {
    path: '/settings/general-config-subscription',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION} replace />,
  },
  {
    path: '/settings/general-config-subscription-plans',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION_PLANS} replace />,
  },
  {
    path: '/settings/general-config-subscription-billing',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION_BILLING} replace />,
  },
  {
    path: '/settings/general-config-subscription-blocked-preview',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION} replace />,
  },
  {
    path: '/general-config',
    element: <Navigate to={GENERAL_CONFIG_BILLING} replace />,
  },
  {
    path: '/general-config/',
    element: <Navigate to={GENERAL_CONFIG_BILLING} replace />,
  },
  {
    path: '/general-config/modules',
    element: <Navigate to={GENERAL_CONFIG_MODULES} replace />,
  },
  {
    path: '/general-config/billing',
    element: <Navigate to={GENERAL_CONFIG_BILLING} replace />,
  },
  {
    path: '/general-config/accounting',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING} replace />,
  },
  {
    path: '/general-config/contabilidad',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING} replace />,
  },
  {
    path: '/general-config/business',
    element: <Navigate to={GENERAL_CONFIG_BUSINESS} replace />,
  },
  {
    path: '/general-config/inventory',
    element: <Navigate to={GENERAL_CONFIG_INVENTORY} replace />,
  },
  {
    path: '/general-config/tax-receipt',
    element: <Navigate to={GENERAL_CONFIG_TAX_RECEIPT} replace />,
  },
  {
    path: '/general-config/tasa-cambio',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/general-config/exchange-rates',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/general-config/authorization',
    element: <Navigate to={GENERAL_CONFIG_AUTHORIZATION} replace />,
  },
  {
    path: '/general-config/app-info',
    element: <Navigate to={GENERAL_CONFIG_APP_INFO} replace />,
  },
  {
    path: '/general-config/users',
    element: <Navigate to={`${USERS}/${USERS_LIST}`} replace />,
  },
  {
    path: '/general-config/subscription',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION} replace />,
  },
  {
    path: '/general-config/subscription/plans',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION_PLANS} replace />,
  },
  {
    path: '/general-config/subscription/billing',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION_BILLING} replace />,
  },
  {
    path: '/general-config/subscription/blocked-preview',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION} replace />,
  },
  {
    path: '/general-config-modules',
    element: <Navigate to={GENERAL_CONFIG_MODULES} replace />,
  },
  {
    path: '/general-config-billing',
    element: <Navigate to={GENERAL_CONFIG_BILLING} replace />,
  },
  {
    path: '/general-config-accounting',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING} replace />,
  },
  {
    path: '/general-config-contabilidad',
    element: <Navigate to={GENERAL_CONFIG_ACCOUNTING} replace />,
  },
  {
    path: '/general-config-business',
    element: <Navigate to={GENERAL_CONFIG_BUSINESS} replace />,
  },
  {
    path: '/general-config-inventory',
    element: <Navigate to={GENERAL_CONFIG_INVENTORY} replace />,
  },
  {
    path: '/general-config-tax-receipt',
    element: <Navigate to={GENERAL_CONFIG_TAX_RECEIPT} replace />,
  },
  {
    path: '/general-config-tasa-cambio',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/general-config-exchange-rates',
    element: <Navigate to={GENERAL_CONFIG_EXCHANGE_RATES} replace />,
  },
  {
    path: '/general-config-authorization',
    element: <Navigate to={GENERAL_CONFIG_AUTHORIZATION} replace />,
  },
  {
    path: '/general-config-app-info',
    element: <Navigate to={GENERAL_CONFIG_APP_INFO} replace />,
  },
  {
    path: '/general-config-users',
    element: <Navigate to={`${USERS}/${USERS_LIST}`} replace />,
  },
  {
    path: '/general-config-subscription',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION} replace />,
  },
  {
    path: '/general-config-subscription-plans',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION_PLANS} replace />,
  },
  {
    path: '/general-config-subscription-billing',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION_BILLING} replace />,
  },
  {
    path: '/general-config-subscription-blocked-preview',
    element: <Navigate to={GENERAL_CONFIG_SUBSCRIPTION} replace />,
  },
  {
    path: ACCOUNT_SUBSCRIPTION,
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_MANAGE} replace />,
  },
  {
    path: '/settings/subscription/manage',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_MANAGE} replace />,
  },
  {
    path: '/settings/subscription/success',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_SUCCESS} replace />,
  },
  {
    // Layout with shared header for all /account/subscription/* pages.
    // Exception: success page renders standalone (no nav).
    path: '/account/subscription',
    element: (
      <FrontendFeatureRouteGate feature="subscriptionManagement">
        <SubscriptionLayout />
      </FrontendFeatureRouteGate>
    ),
    children: [
      {
        path: 'resumen',
        element: <SubscriptionOverviewPage />,
      },
      {
        path: 'plans',
        element: <SubscriptionPlansPage />,
      },
      {
        path: 'billing',
        element: <SubscriptionBillingPage />,
      },
      {
        path: 'payment-methods',
        element: <SubscriptionPaymentMethodPage />,
      },
      {
        path: 'settings',
        element: <SubscriptionSettingsPage />,
      },
      {
        path: 'blocked-preview',
        element: <Navigate to={ACCOUNT_SUBSCRIPTION_MANAGE} replace />,
      },
    ],
  },
  {
    path: ACCOUNT_SUBSCRIPTION_SUCCESS,
    element: (
      <FrontendFeatureRouteGate feature="subscriptionManagement">
        <SubscriptionSuccessPage />
      </FrontendFeatureRouteGate>
    ),
  },
  {
    path: '/settings/account/subscription',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION} replace />,
  },
  {
    path: '/settings/account/subscription/plans',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_PLANS} replace />,
  },
  {
    path: '/settings/account/subscription/billing',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_BILLING} replace />,
  },
  {
    path: '/settings/account/subscription/payment-methods',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS} replace />,
  },
  {
    path: '/settings/account/subscription/settings',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_SETTINGS} replace />,
  },
  {
    path: '/settings/account/subscription/blocked-preview',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_MANAGE} replace />,
  },
  {
    path: '/account/subscription/manage',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_MANAGE} replace />,
  },
  {
    path: '/settings/account/subscription/manage',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_MANAGE} replace />,
  },
  {
    path: '/settings/account/subscription/success',
    element: <Navigate to={ACCOUNT_SUBSCRIPTION_SUCCESS} replace />,
  },
  {
    path: `${CREATE_BUSINESS}`,
    element: (
      <FrontendFeatureRouteGate feature="businessCreation">
        <BusinessCreatePage />
      </FrontendFeatureRouteGate>
    ),
  },
  {
    path: ROUTES_NAME.DEV_VIEW_TERM.SWITCH_BUSINESS,
    element: <SwitchBusiness />,
  },
];

export default Routes;
