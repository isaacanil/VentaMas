import AuthorizationFlowConfig from '../../views/component/GeneralConfig/configs/AuthorizationFlowConfig';
import BillingConfig from '../../views/component/GeneralConfig/configs/BillingConfig';
import InventoryConfig from '../../views/component/GeneralConfig/configs/InventoryConfig';
import GeneralConfig from '../../views/component/GeneralConfig/GeneralConfig';
import SwitchBusiness from '../../views/pages/dev/SwitchBusiness';
import { Setting } from '../../views/pages/setting/setting';
import AppInfo from '../../views/pages/setting/subPage/AppInfo/AppInfo';
import BusinessCreator from '../../views/pages/setting/subPage/BusinessEditor/BusinessCreator';
import BusinessInfo from '../../views/pages/setting/subPage/BusinessEditor/BusinessEditorProfile';
import { TaxReceiptSetting } from '../../views/pages/setting/subPage/TaxReceipts/TaxReceIptSetting';
import { UserList } from '../../views/pages/setting/subPage/Users/components/UsersList/UserList';
import { UserAdmin } from '../../views/pages/setting/subPage/Users/UserAdmin';
import { UserActivity } from '../../views/pages/setting/subPage/Users/UserActivity';
import { UserSessionLogs } from '../../views/pages/setting/subPage/Users/UserSessionLogs';
import { getRelativePath } from '../getConfigRoute';
import ROUTES_NAME from '../routesName';

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
const Routes = [
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
