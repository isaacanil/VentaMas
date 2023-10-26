import { Setting, TaxReceiptSetting, UserAdmin } from "../../views";
import { Utility } from "../../views/pages/Utility/Utility";
import AppInfo from "../../views/pages/setting/subPage/AppInfo/AppInfo";
import BusinessInfo from "../../views/pages/setting/subPage/BusinessEditor/BusinessEditorProfile";
import EditUser from "../../views/pages/setting/subPage/Users/components/EditUser/EditUser";
import SignUp from "../../views/pages/setting/subPage/Users/components/SignUp";
import { UserList } from "../../views/pages/setting/subPage/Users/components/UsersList/UserList";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";

const {
    UTILITY,
    UTILITY_REPORT
} = ROUTES_NAME.UTILITY_TERM;


const Routes = [
    { path: UTILITY_REPORT, element: validateRouteAccess(<Utility />), },
]

export default Routes;