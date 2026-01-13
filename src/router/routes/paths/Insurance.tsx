import { lazy } from 'react';

import { ROUTES } from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const InsuranceConfig = lazy(() =>
  import('@/modules/insurance/pages/Insurance/InsuranceConfig/InsuraceConfig'),
);
const InsuranceConfigForm = lazy(() =>
  import('@/modules/insurance/pages/Insurance/InsuranceConfigForm/InsuranceConfigForm'),
);

const { INSURANCE_CONFIG, INSURANCE_CREATE } = ROUTES.INSURANCE_TERM;

const Routes: AppRoute[] = [
  {
    path: INSURANCE_CONFIG,
    element: <InsuranceConfig />,
  },
  // {
  //     path: INSURANCE_TERM.INSURANCE_LIST,
  //     element: <InsuranceConfigForm />,
  // },
  {
    path: INSURANCE_CREATE,
    element: <InsuranceConfigForm />,
  },
  // {
  //     path: INSURANCE_TERM.INSURANCE_EDIT,
  //     element: <InsuranceConfigForm />,
  // },
  // {
  //     path: INSURANCE_TERM.INSURANCE_DETAILS,
  //     element: <InsuranceConfigForm />,
  // },
];

export default Routes;

