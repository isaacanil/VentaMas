import ROUTES_NAME from "../routesName";
import { getRelativePath } from "../getConfigRoute";
import { lazyImport } from "../lazyImport";

const Setting = lazyImport(() => import("../../views/pages/setting/setting"), "Setting");
const TaxReceiptSetting = lazyImport(() => import("../../views/pages/setting/subPage/TaxReceipts/TaxReceIptSetting"), "TaxReceiptSetting");
const UserAdmin = lazyImport(() => import("../../views/pages/setting/subPage/Users/UserAdmin"), "UserAdmin");
const SwitchBusiness = lazyImport(() => import("../../views/pages/dev/SwitchBusiness"));
const GeneralConfig = lazyImport(() => import("../../views/component/GeneralConfig/GeneralConfig"));
const BillingConfig = lazyImport(() => import("../../views/component/GeneralConfig/configs/BillingConfig"));
const AuthorizationFlowConfig = lazyImport(() => import("../../views/component/GeneralConfig/configs/AuthorizationFlowConfig"));
const AppInfo = lazyImport(() => import("../../views/pages/setting/subPage/AppInfo/AppInfo"));
const BusinessInfo = lazyImport(() => import("../../views/pages/setting/subPage/BusinessEditor/BusinessEditorProfile"));
const BusinessCreator = lazyImport(() => import("../../views/pages/setting/subPage/BusinessEditor/BusinessCreator"));
// const EditUser = lazyImport(() => import("../../views/pages/setting/subPage/Users/components/EditUser/EditUser"));
const UserList = lazyImport(() => import("../../views/pages/setting/subPage/Users/components/UsersList/UserList"), "UserList");

const {
    SETTINGS,
    USERS,
    USERS_LIST,
    TAX_RECEIPT,
    SETTING,
    APP_INFO,
    BUSINESS_INFO,
    CREATE_BUSINESS,
    GENERAL_CONFIG_APP_INFO,
    GENERAL_CONFIG_BILLING,
    GENERAL_CONFIG_BUSINESS,
    GENERAL_CONFIG_TAX_RECEIPT,
    GENERAL_CONFIG_USERS,
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
        ]
    },    {        path: `${SETTING}`,
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
                path: getRelativePath(GENERAL_CONFIG_TAX_RECEIPT, SETTING),
                element: <TaxReceiptSetting />,
            },
            {
                path: getRelativePath(GENERAL_CONFIG_USERS, SETTING),
                element: <UserList />,
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
    { path: ROUTES_NAME.DEV_VIEW_TERM.SWITCH_BUSINESS, element: <SwitchBusiness /> }
]

export default Routes;
