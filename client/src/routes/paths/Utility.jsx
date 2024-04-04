import { Utility } from "../../views/pages/Utility/Utility";
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