import { Setting, TaxReceiptSetting, UserAdmin } from "../../views";
import AppInfo from "../../views/pages/setting/subPage/AppInfo/AppInfo";
import BusinessInfo from "../../views/pages/setting/subPage/BusinessEditor/BusinessEditorProfile";
import EditUser from "../../views/pages/setting/subPage/Users/components/EditUser";
import SignUp from "../../views/pages/setting/subPage/Users/components/SignUp";
import { UserList } from "../../views/pages/setting/subPage/Users/components/UsersList/UserList";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";

const { SETTING_TERM } = ROUTES_NAME;
const { SETTINGS, USERS, UPDATE_USER, USERS_LIST, TAX_RECEIPT, APP_INFO, BUSINESS_INFO, CREATE_USER } = SETTING_TERM;
const basePath = SETTINGS;
const Routes = [
    { path: SETTINGS, element: validateRouteAccess(<Setting />), },
    {
        path: USERS,
        element: validateRouteAccess(<UserAdmin />),
        name: USERS,
        children: [
            {
                path: USERS_LIST,
                element: validateRouteAccess(<UserList />, 'read', 'User'),
            },
            {
                path: CREATE_USER,
                element: validateRouteAccess(<SignUp />),
            },
            {
                path: UPDATE_USER,
                element: validateRouteAccess(<EditUser/>),
            }

        ]
    },
    { path: `${basePath}${TAX_RECEIPT}`, element: validateRouteAccess(<TaxReceiptSetting />), name: TAX_RECEIPT },
    { path: `${basePath}${BUSINESS_INFO}`, element: validateRouteAccess(<BusinessInfo />), name: BUSINESS_INFO },
    { path: `${basePath}${APP_INFO}`, element: validateRouteAccess(<AppInfo />), name: APP_INFO }
]

export default Routes;