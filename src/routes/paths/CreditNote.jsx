import ROUTES_NAME from "../routesName";
import { ROUTE_STATUS } from "../routeMeta";
import { lazyImport } from "../lazyImport";

const CreditNoteList = lazyImport(() => import("../../views/pages/CreditNote"), "CreditNoteList");

const { CREDIT_NOTE_LIST } = ROUTES_NAME.CREDIT_NOTE_TERM;

const Routes = [
  {
    path: CREDIT_NOTE_LIST,
    element: <CreditNoteList />,
    title: "Notas de Crédito",
    metaDescription: "Listado de notas de crédito.",
    status: ROUTE_STATUS.WIP,
  },
];

export default Routes;
