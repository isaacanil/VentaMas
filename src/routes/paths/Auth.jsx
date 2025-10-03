import ROUTES_NAME from "../routesName";
import { lazyImport } from "../lazyImport";

const { LOGIN } = ROUTES_NAME.AUTH_TERM;
const LoginV2 = lazyImport(() => import("../../views/pages/Login/Loginv2/Loginv2"), "LoginV2");
const Routes = [
    { path: LOGIN, element: <LoginV2 />, isPublic: true },
]

export default Routes;
