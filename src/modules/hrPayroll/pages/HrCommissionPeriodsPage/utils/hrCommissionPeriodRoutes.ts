import { generatePath } from 'react-router-dom';

import ROUTES_NAME from '@/router/routes/routesName';

export const buildHrCommissionPeriodDetailPath = (periodId: string) =>
  generatePath(ROUTES_NAME.HR_PAYROLL_TERM.HR_COMMISSION_PERIOD_DETAIL, {
    periodId,
  });
