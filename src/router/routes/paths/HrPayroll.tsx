import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Navigate } from 'react-router-dom';

import {
  loadHrCommissionPeriodsRoute,
  loadHrCommissionsRoute,
  loadHrPayrollWorkspaceRoute,
} from '@/modules/hrPayroll/public';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const HrPayrollWorkspace = lazy(loadHrPayrollWorkspaceRoute);
const HrCommissionsPage = lazy(loadHrCommissionsRoute);
const HrCommissionPeriodsPage = lazy(loadHrCommissionPeriodsRoute);

const {
  HR_PAYROLL,
  HR_EMPLOYEES,
  HR_COMMISSIONS,
  HR_COMMISSION_PERIOD_DETAIL,
  HR_COMMISSION_PERIODS,
} = ROUTES_NAME.HR_PAYROLL_TERM;

const routes: AppRoute[] = [
  {
    path: HR_PAYROLL,
    element: <HrPayrollWorkspace />,
    title: 'RRHH y nomina - Ventamax',
    metaDescription:
      'Gestiona colaboradores, perfiles de nomina y vinculacion de usuarios en Ventamax.',
  },
  {
    path: HR_EMPLOYEES,
    element: <HrPayrollWorkspace />,
    title: 'Colaboradores - Ventamax',
    metaDescription:
      'Administra empleados, metodos de pago y comisiones base en Ventamax.',
  },
  {
    path: HR_COMMISSIONS,
    element: <HrCommissionsPage />,
    title: 'Comisiones RRHH - Ventamax',
    metaDescription:
      'Revisa y recalcula comisiones de colaboradores para cortes y nomina en Ventamax.',
  },
  {
    path: HR_COMMISSION_PERIODS,
    element: <HrCommissionPeriodsPage />,
    title: 'Cortes y pagos RRHH - Ventamax',
    metaDescription:
      'Agrupa comisiones por periodo, aprueba cortes y registra pagos a colaboradores en Ventamax.',
  },
  {
    path: HR_COMMISSION_PERIOD_DETAIL,
    element: <HrCommissionPeriodsPage />,
    title: 'Detalle de corte RRHH - Ventamax',
    metaDescription:
      'Revisa colaboradores, pagos y acciones operativas de un corte de comisiones RRHH en Ventamax.',
  },
  {
    path: '/recursos-humanos',
    element: <Navigate to={HR_PAYROLL} replace />,
  },
  {
    path: '/nomina',
    element: <Navigate to={HR_PAYROLL} replace />,
  },
];

export default routes;
