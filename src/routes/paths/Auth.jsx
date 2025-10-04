import { LoginV2 } from "../../views/pages/Login/Loginv2/Loginv2";
import ROUTES_NAME from "../routesName";

const { LOGIN } = ROUTES_NAME.AUTH_TERM;
const Routes = [
    { path: LOGIN, element: <LoginV2 />, isPublic: true },
]

export default Routes;
