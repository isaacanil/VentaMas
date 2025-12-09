import { lazy } from 'react';

import ROUTES_NAME from '../routesName';

const Login = lazy(() =>
  import('../../views/pages/Login/Login').then((module) => ({
    default: module.Login,
  })),
);

const { LOGIN } = ROUTES_NAME.AUTH_TERM;
const Routes = [{ path: LOGIN, element: <Login />, isPublic: true }];

export default Routes;
