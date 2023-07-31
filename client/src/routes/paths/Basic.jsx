import { Home, Welcome } from "../../views";
import ROUTES_NAME from "../routesName";
import validateRouteAccess from "../requiereAuthProvider";
const { BASIC_TERM } = ROUTES_NAME;
const { HOME, WELCOME } = BASIC_TERM;
const Routes = [
    {
        path: WELCOME,
        element: <Welcome />,
    },
    {
        path: HOME,
        element: (
            validateRouteAccess(<Home />)  
        ),
    }
]

export default Routes;