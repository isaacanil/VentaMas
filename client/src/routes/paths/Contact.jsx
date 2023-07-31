import { ClientAdmin, ProviderAdmin } from "../../views";
import validateRouteAccess from "../requiereAuthProvider";
import ROUTES_NAME from "../routesName";
const {CONTACT_TERM} = ROUTES_NAME;
const {CLIENTS, SUPPLIERS} = CONTACT_TERM;
const Routes = [
    { path: CLIENTS, element: validateRouteAccess(<ClientAdmin />) } ,
    { path: SUPPLIERS, element: validateRouteAccess(<ProviderAdmin />)}
]

export default Routes;