import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import {
  loadInsuranceConfigRoute,
  loadInsuranceCreateRoute,
} from '@/modules/insurance/public';
import { ROUTES } from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const InsuranceConfig = lazy(loadInsuranceConfigRoute);
const InsuranceConfigForm = lazy(loadInsuranceCreateRoute);

const { INSURANCE_CONFIG, INSURANCE_CREATE } = ROUTES.INSURANCE_TERM;

const Routes: AppRoute[] = [
  {
    path: INSURANCE_CONFIG,
    element: <InsuranceConfig />,
  },
  {
    path: INSURANCE_CREATE,
    element: <InsuranceConfigForm />,
  },
];

export default Routes;
