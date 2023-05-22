import { ClientAdmin, ProviderAdmin } from "../../views";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";
const {CONTACT_TERM} = ROUTES_NAME;
const {CLIENTS, SUPPLIERS} = CONTACT_TERM;
const Routes = [
    { path: "/client", element: validateRouteAccess(<ClientAdmin />), name: CLIENTS } ,
    { path: "/provider/",element: validateRouteAccess(<ProviderAdmin />), name: SUPPLIERS}
]

export default Routes;