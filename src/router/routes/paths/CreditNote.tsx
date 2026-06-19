import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import { loadCreditNoteListRoute } from '@/modules/invoice/public';
import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const CreditNoteList = lazy(loadCreditNoteListRoute);

const { CREDIT_NOTE_LIST } = ROUTES_NAME.CREDIT_NOTE_TERM;

const Routes: AppRoute[] = [
  {
    path: CREDIT_NOTE_LIST,
    element: <CreditNoteList />,
    title: 'Notas de Crédito',
    metaDescription: 'Listado de notas de crédito.',
    status: ROUTE_STATUS.STABLE,
  },
];

export default Routes;
