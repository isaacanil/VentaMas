import { Login, SignUp } from "../../views";
import ROUTES_NAME from "../routesName";
const {AUTH_TERM} = ROUTES_NAME;
const {LOGIN, SIGNUP} = AUTH_TERM;
const Routes = [
    { path: "/login", element: <Login />, name: LOGIN },
    { path: "/signup", element: <SignUp />, name: SIGNUP },
]

export default Routes;