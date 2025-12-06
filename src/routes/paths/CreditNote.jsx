import { CreditNoteList } from '../../views/pages/CreditNote';
import { ROUTE_STATUS } from '../routeMeta';
import ROUTES_NAME from '../routesName';

const { CREDIT_NOTE_LIST } = ROUTES_NAME.CREDIT_NOTE_TERM;

const Routes = [
  {
    path: CREDIT_NOTE_LIST,
    element: <CreditNoteList />,
    title: 'Notas de Crédito',
    metaDescription: 'Listado de notas de crédito.',
    status: ROUTE_STATUS.WIP,
  },
];

export default Routes;
