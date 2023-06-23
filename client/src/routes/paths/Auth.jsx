import { Login, SignUp } from "../../views";
import { BasicLogin } from "../../views/pages/Login/BasicLogin";
import { LoginV2 } from "../../views/pages/Login/Loginv2";
import ROUTES_NAME from "../routesName";
const {AUTH_TERM} = ROUTES_NAME;
const {LOGIN, SIGNUP} = AUTH_TERM;
const Routes = [
    { path: "/login", element: <BasicLogin />, name: LOGIN },
    { path: "/signup", element: <SignUp />, name: SIGNUP },
]

export default Routes;