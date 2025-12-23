import { lazy } from 'react';

import ROUTES_NAME from '@/router/routes/routesName';

const ClientAdmin = lazy(() =>
  import('@/views/pages/Contact/Client/ClientAdmin').then((module) => ({
    default: module.ClientAdmin,
  })),
);
const ProviderAdmin = lazy(() =>
  import('@/views/pages/Contact/Provider/ProviderAdmin').then((module) => ({
    default: module.ProviderAdmin,
  })),
);

const { CONTACT_TERM } = ROUTES_NAME;
const { CLIENTS, SUPPLIERS } = CONTACT_TERM;
const Routes = [
  { path: CLIENTS, element: <ClientAdmin /> },
  { path: SUPPLIERS, element: <ProviderAdmin /> },
];

export default Routes;
