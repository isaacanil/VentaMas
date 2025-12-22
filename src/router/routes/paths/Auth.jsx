import { Login } from '@/views/pages/Login/Login';
import ROUTES_NAME from '../routesName';

const { LOGIN } = ROUTES_NAME.AUTH_TERM;
const Routes = [{ path: LOGIN, element: <Login />, isPublic: true }];

export default Routes;
