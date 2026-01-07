import { lazy } from 'react';

import { getRelativePath } from '@/router/routes/getConfigRoute';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const AuthorizationFlowConfig = lazy(() =>
  import(
    '@/views/component/GeneralConfig/configs/AuthorizationFlowConfig'
  ),
);
const BillingConfig = lazy(() =>
  import('@/views/component/GeneralConfig/configs/BillingConfig'),
);
const InventoryConfig = lazy(() =>
  import('@/views/component/GeneralConfig/configs/InventoryConfig'),
);
const GeneralConfig = lazy(() =>
  import('@/views/component/GeneralConfig/GeneralConfig'),
);
const SwitchBusiness = lazy(() =>
  import('@/views/pages/dev/SwitchBusiness'),
);
const Setting = lazy(() =>
  import('@/views/pages/setting/setting').then((module) => ({
    default: module.Setting,
  })),
);
const AppInfo = lazy(() =>
  import('@/views/pages/setting/subPage/AppInfo/AppInfo'),
);
const BusinessCreator = lazy(() =>
  import('@/views/pages/setting/subPage/BusinessEditor/BusinessCreator'),
);
const BusinessInfo = lazy(() =>
  import('@/views/pages/setting/subPage/BusinessEditor/BusinessEditorProfile'),
);
const TaxReceiptSetting = lazy(() =>
  import(
    '@/views/pages/setting/subPage/TaxReceipts/TaxReceIptSetting'
  ).then((module) => ({ default: module.TaxReceiptSetting })),
);
const UserList = lazy(() =>
  import(
    '@/views/pages/setting/subPage/Users/components/UsersList/UserList'
  ).then((module) => ({ default: module.UserList })),
);
const UserActivity = lazy(() =>
  import('@/views/pages/setting/subPage/Users/UserActivity').then(
    (module) => ({ default: module.UserActivity }),
  ),
);
const UserAdmin = lazy(() =>
  import('@/views/pages/setting/subPage/Users/UserAdmin').then(
    (module) => ({ default: module.UserAdmin }),
  ),
);
const UserSessionLogs = lazy(() =>
  import('@/views/pages/setting/subPage/Users/UserSessionLogs').then(
    (module) => ({ default: module.UserSessionLogs }),
  ),
);

const {
  SETTINGS,
  USERS,
  USERS_LIST,
  USERS_SESSION_LOGS,
  USERS_ACTIVITY_DETAIL,
  TAX_RECEIPT,
  SETTING,
  APP_INFO,
  BUSINESS_INFO,
  CREATE_BUSINESS,
  GENERAL_CONFIG_APP_INFO,
  GENERAL_CONFIG_BILLING,
  GENERAL_CONFIG_BUSINESS,
  GENERAL_CONFIG_INVENTORY,
  GENERAL_CONFIG_TAX_RECEIPT,
  GENERAL_CONFIG_AUTHORIZATION,
} = ROUTES_NAME.SETTING_TERM;

const basePath = SETTINGS;
const Routes: AppRoute[] = [
  { path: SETTINGS, element: <Setting /> },
  {
    path: USERS,
    element: <UserAdmin />,
    name: USERS,
    children: [
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
    ],
  },
  {
    path: `${SETTING}`,
    element: <GeneralConfig />,
    children: [
      {
        path: '',
        element: <BillingConfig />,
      },
      {
        path: getRelativePath(GENERAL_CONFIG_BILLING, SETTING),
        element: <BillingConfig />,
      },
      {
        path: getRelativePath(GENERAL_CONFIG_BUSINESS, SETTING),
        element: <BusinessInfo />,
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
  { path: `${basePath}${TAX_RECEIPT}`, element: <TaxReceiptSetting /> },
  { path: `${basePath}${BUSINESS_INFO}`, element: <BusinessInfo /> },
  { path: `${CREATE_BUSINESS}`, element: <BusinessCreator /> },
  { path: `${basePath}${APP_INFO}`, element: <AppInfo /> },
  {
    path: ROUTES_NAME.DEV_VIEW_TERM.SWITCH_BUSINESS,
    element: <SwitchBusiness />,
  },
];

export default Routes;

