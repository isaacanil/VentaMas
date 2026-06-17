export const loadAccountingConfigRoute = () =>
  import('./components/GeneralConfig/configs/AccountingConfig/AccountingConfig');

export const loadAccountSubscriptionLayoutRoute = () =>
  import('./pages/subscription/SubscriptionLayout');

export const loadAccountSubscriptionOverviewRoute = () =>
  import('./pages/subscription/SubscriptionOverviewPage');

export const loadAccountSubscriptionPlansRoute = () =>
  import('./pages/subscription/SubscriptionPlansPage');

export const loadAccountSubscriptionBillingRoute = () =>
  import('./pages/subscription/SubscriptionBillingPage');

export const loadAccountSubscriptionPaymentMethodRoute = () =>
  import('./pages/subscription/SubscriptionPaymentMethodPage');

export const loadAccountSubscriptionSettingsRoute = () =>
  import('./pages/subscription/SubscriptionSettingsPage');

export const loadAccountSubscriptionSuccessRoute = () =>
  import('./pages/subscription/SubscriptionSuccessPage');

export const loadAppInfoRoute = () =>
  import('./pages/setting/subPage/AppInfo/AppInfo');

export const loadAuthorizationFlowConfigRoute = () =>
  import('./components/GeneralConfig/configs/AuthorizationFlowConfig');

export const loadBillingConfigRoute = () =>
  import('./components/GeneralConfig/configs/BillingConfig');

export const loadBusinessCreateRoute = () =>
  import('./pages/setting/subPage/BusinessEditor/BusinessCreatePage');

export const loadBusinessEditRoute = () =>
  import('./pages/setting/subPage/BusinessEditor/BusinessEditPage');

export const loadDeveloperSubscriptionMaintenanceRoute = () =>
  import('./pages/subscription/DeveloperSubscriptionMaintenancePage');

export const loadDeveloperSubscriptionMaintenancePlansRoute = () =>
  import('./pages/subscription/DeveloperSubscriptionMaintenancePlansPage');

export const loadGeneralConfigRoute = () =>
  import('./components/GeneralConfig/GeneralConfig');

export const loadInventoryConfigRoute = () =>
  import('./components/GeneralConfig/configs/InventoryConfig');

export const loadModulesConfigRoute = () =>
  import('./components/GeneralConfig/configs/ModulesConfig/ModulesConfig');

export const loadSignUpUserModal = () =>
  import('./pages/setting/subPage/Users/components/UserForm').then(
    (module) => ({
      default: module.SignUpModal,
    }),
  );

export const loadSubscriptionConfigRoute = () =>
  import('./components/GeneralConfig/configs/SubscriptionConfig');

export const loadTaxReceiptSettingRoute = () =>
  import('./pages/setting/subPage/TaxReceipts/TaxReceiptSetting').then(
    (module) => ({ default: module.TaxReceiptSetting }),
  );

export const loadUserActivityRoute = () =>
  import('./pages/setting/subPage/Users/UserActivity').then((module) => ({
    default: module.UserActivity,
  }));

export const loadUsersAdminRoute = () =>
  import('./pages/setting/subPage/Users/UserAdmin').then((module) => ({
    default: module.UserAdmin,
  }));

export const loadUsersLandingRedirectRoute = () =>
  import('./pages/setting/subPage/Users/UserAdmin').then((module) => ({
    default: module.UsersLandingRedirect,
  }));

export const loadUserSessionLogsRoute = () =>
  import('./pages/setting/subPage/Users/UserSessionLogs').then((module) => ({
    default: module.UserSessionLogs,
  }));

export const loadUsersListRoute = () =>
  import('./pages/setting/subPage/Users/components/UsersList/UserList').then(
    (module) => ({ default: module.UserList }),
  );
