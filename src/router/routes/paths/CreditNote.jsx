import { lazy } from 'react';

import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import ROUTES_NAME from '@/router/routes/routesName';

const CreditNoteList = lazy(() =>
  import('@/views/pages/CreditNote').then((module) => ({
    default: module.CreditNoteList,
  })),
);

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
