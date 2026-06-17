import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import { loadDebitNoteListRoute } from '@/modules/invoice/public';
import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const DebitNoteList = lazy(loadDebitNoteListRoute);

const { DEBIT_NOTE_LIST } = ROUTES_NAME.DEBIT_NOTE_TERM;

const Routes: AppRoute[] = [
  {
    path: DEBIT_NOTE_LIST,
    element: <DebitNoteList />,
    title: 'Notas de Débito',
    metaDescription: 'Listado de notas de débito.',
    status: ROUTE_STATUS.WIP,
  },
];

export default Routes;
