import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const ClientAdmin = lazy(() =>
  import('@/modules/contacts/pages/Contact/Client/ClientAdmin').then(
    (module) => ({
      default: module.ClientAdmin,
    }),
  ),
);
const ProviderAdmin = lazy(() =>
  import('@/modules/contacts/pages/Contact/Provider/ProviderAdmin').then(
    (module) => ({
      default: module.ProviderAdmin,
    }),
  ),
);

const { CONTACT_TERM } = ROUTES_NAME;
const { CLIENTS, SUPPLIERS } = CONTACT_TERM;
const Routes: AppRoute[] = [
  { path: CLIENTS, element: <ClientAdmin /> },
  { path: SUPPLIERS, element: <ProviderAdmin /> },
];

export default Routes;
