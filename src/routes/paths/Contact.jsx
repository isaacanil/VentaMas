import ROUTES_NAME from "../routesName";
import { lazyImport } from "../lazyImport";

const ClientAdmin = lazyImport(() => import("../../views/pages/Contact/Client/ClientAdmin"), "ClientAdmin");
const ProviderAdmin = lazyImport(() => import("../../views/pages/Contact/Provider/ProviderAdmin"), "ProviderAdmin");
const {CONTACT_TERM} = ROUTES_NAME;
const {CLIENTS, SUPPLIERS} = CONTACT_TERM;
const Routes = [
    { path: CLIENTS, element: <ClientAdmin /> },
    { path: SUPPLIERS, element: <ProviderAdmin /> }
]

export default Routes;
