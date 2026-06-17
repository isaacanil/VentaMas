import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import {
  loadClientAdminRoute,
  loadProviderAdminRoute,
} from '@/modules/contacts/public';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const ClientAdmin = lazy(loadClientAdminRoute);
const ProviderAdmin = lazy(loadProviderAdminRoute);

const { CONTACT_TERM } = ROUTES_NAME;
const { CLIENTS, SUPPLIERS } = CONTACT_TERM;
const Routes: AppRoute[] = [
  { path: CLIENTS, element: <ClientAdmin /> },
  { path: SUPPLIERS, element: <ProviderAdmin /> },
];

export default Routes;
