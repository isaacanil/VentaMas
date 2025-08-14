import ROUTES_NAME from "../routesName";
import { CreditNoteList } from "../../views/pages/CreditNote";

const { CREDIT_NOTE_LIST } = ROUTES_NAME.CREDIT_NOTE_TERM;

const Routes = [
  {
    path: CREDIT_NOTE_LIST,
    element: <CreditNoteList />,
    title: "Notas de Crédito",
    metaDescription: "Listado de notas de crédito.",
  },
];

export default Routes;
