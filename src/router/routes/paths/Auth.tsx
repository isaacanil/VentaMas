import ROUTES_NAME from '@/router/routes/routesName';
import { Login } from '@/modules/auth/pages/Login/Login';
import type { AppRoute } from '@/router/routes/routes';

const { LOGIN } = ROUTES_NAME.AUTH_TERM;
const Routes: AppRoute[] = [{ path: LOGIN, element: <Login />, isPublic: true }];

export default Routes;

