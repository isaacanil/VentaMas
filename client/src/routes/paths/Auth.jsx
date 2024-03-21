import {  Login, SignUp } from "../../views";
import { BasicLogin } from "../../views/pages/Login/BasicLogin";

import { LoginV2 } from "../../views/pages/Login/Loginv2/Loginv2";
import ROUTES_NAME from "../routesName";

const {LOGIN, SIGNUP} = ROUTES_NAME.AUTH_TERM;
const Routes = [
    { path: LOGIN, element: <LoginV2 /> },
    { path: SIGNUP, element: <SignUp /> },
]

export default Routes;