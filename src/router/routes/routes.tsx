import { NotFound } from '@/modules/app/pages/NotFound/NotFound';
import accountReceivable from '@/router/routes/paths/AccountReceivable';
import accountsPayable from '@/router/routes/paths/AccountsPayable';
import accounting from '@/router/routes/paths/Accounting';
import auth from '@/router/routes/paths/Auth';
import authorizations from '@/router/routes/paths/Authorizations';
import basic from '@/router/routes/paths/Basic';
import cashReconciliation from '@/router/routes/paths/CashReconciliztion';
import changelogs from '@/router/routes/paths/Changelogs';
import contacts from '@/router/routes/paths/Contact';
import creditNote from '@/router/routes/paths/CreditNote';
import dev from '@/router/routes/paths/Dev';
import expenses from '@/router/routes/paths/Expenses';
import hrPayroll from '@/router/routes/paths/HrPayroll';
import insurance from '@/router/routes/paths/Insurance';
import inventory from '@/router/routes/paths/Inventory';
import lab from '@/router/routes/paths/Lab';
import orders from '@/router/routes/paths/Orders';
import purchases from '@/router/routes/paths/Purchases';
import sales from '@/router/routes/paths/Sales';
import settings from '@/router/routes/paths/Setting';
import treasury from '@/router/routes/paths/Treasury';
import utility from '@/router/routes/paths/Utility';
import { filterRoutes } from '@/router/routes/routeFiltering';
import { processRoutes } from '@/router/routes/routeProcessing';
import { registerRoutes as registerRoutesIndex } from '@/router/routes/routeVisibility';
import type { AppRoute } from '@/router/types/routeTypes';

const baseRawRoutes = [
  ...(basic as AppRoute[]),
  ...(auth as AppRoute[]),
  ...(inventory as AppRoute[]),
  ...(contacts as AppRoute[]),
  ...(settings as AppRoute[]),
  ...(sales as AppRoute[]),
  ...(orders as AppRoute[]),
  ...(purchases as AppRoute[]),
  ...(lab as AppRoute[]),
  ...(cashReconciliation as AppRoute[]),
  ...(treasury as AppRoute[]),
  ...(expenses as AppRoute[]),
  ...accounting,
  ...hrPayroll,
  ...(dev as AppRoute[]),
  ...(changelogs as AppRoute[]),
  ...(utility as AppRoute[]),
  ...accountsPayable,
  ...accountReceivable,
  ...(insurance as AppRoute[]),
  ...(creditNote as AppRoute[]),
  ...(authorizations as AppRoute[]),
  {
    path: '*',
    element: <NotFound />,
    title: 'Página no encontrada',
    metaDescription: 'Lo sentimos, la página que estás buscando no existe.',
    isPublic: true,
  },
] satisfies AppRoute[];

const rawRoutes = filterRoutes(baseRawRoutes);

export const routes = processRoutes(rawRoutes);
registerRoutesIndex(routes);
