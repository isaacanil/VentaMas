import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Navigate } from 'react-router-dom';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const HrPayrollWorkspace = lazy(
  () =>
    import('@/modules/hrPayroll/pages/HrPayrollWorkspace/HrPayrollWorkspace'),
);
const HrCommissionsPage = lazy(
  () => import('@/modules/hrPayroll/pages/HrCommissionsPage/HrCommissionsPage'),
);

const { HR_PAYROLL, HR_EMPLOYEES, HR_COMMISSIONS } =
  ROUTES_NAME.HR_PAYROLL_TERM;

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
    path: '/recursos-humanos',
    element: <Navigate to={HR_PAYROLL} replace />,
  },
  {
    path: '/nomina',
    element: <Navigate to={HR_PAYROLL} replace />,
  },
];

export default routes;
