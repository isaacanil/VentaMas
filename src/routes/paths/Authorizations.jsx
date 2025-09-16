import ROUTES_NAME from "../routesName";
import { ROUTE_STATUS } from "../routeMeta";
import { InvoiceEditAuthorizations } from "../../views/pages/Authorizations/InvoiceEditAuthorizations";

const { AUTHORIZATIONS_LIST } = ROUTES_NAME.AUTHORIZATIONS_TERM;

const Routes = [
  {
    path: AUTHORIZATIONS_LIST,
    element: <InvoiceEditAuthorizations />,
    title: "Autorizaciones",
    metaDescription: "Gestión de solicitudes de autorización.",
    status: ROUTE_STATUS.WIP,
  },
];

export default Routes;

