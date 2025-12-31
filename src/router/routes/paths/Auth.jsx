import ROUTES_NAME from '@/router/routes/routesName';
import { Login } from '@/views/pages/Login/Login';

const { LOGIN } = ROUTES_NAME.AUTH_TERM;
const Routes = [{ path: LOGIN, element: <Login />, isPublic: true }];

export default Routes;
