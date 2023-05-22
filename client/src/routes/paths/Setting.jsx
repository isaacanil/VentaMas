import { Setting, TaxReceiptSetting, UserAdmin } from "../../views";
import AppInfo from "../../views/pages/setting/subPage/AppInfo/AppInfo";
import BusinessInfo from "../../views/pages/setting/subPage/BusinessEditor/BusinessEditorProfile";
import SignUp from "../../views/pages/setting/subPage/Users/components/SignUp";
import { UserList } from "../../views/pages/setting/subPage/Users/components/UsersList/UserList";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";

const { SETTING_TERM } = ROUTES_NAME;
const { SETTINGS, USERS, USERS_LIST, TAX_RECEIPT, APP_INFO, BUSINESS_INFO, CREATE_USER } = SETTING_TERM;
const basePath = "settings";
const Routes = [
    { path: `/${basePath}`, element: validateRouteAccess(<Setting />), name: SETTINGS },
    {
        path: `/users`,
        element: validateRouteAccess(<UserAdmin />),
        name: USERS,
        children: [
            {
                path: `list`,
                element: validateRouteAccess(<UserList />),
                name: USERS_LIST
            }, 
            {
                path: `create`,
                element: validateRouteAccess(<SignUp />),
                name: CREATE_USER
            },   

        ]
    },
    { path: `/${basePath}/tax-receipt`, element: validateRouteAccess(<TaxReceiptSetting />), name: TAX_RECEIPT },
    { path: `/${basePath}/business`, element: validateRouteAccess(<BusinessInfo />), name: BUSINESS_INFO },
    { path: `/${basePath}/app-info`, element: validateRouteAccess(<AppInfo />), name: APP_INFO }
]

export default Routes;