import { createBrowserRouter } from 'react-router';

import { RouteErrorFallback } from '@/components/ui/ErrorComponent/RouteErrorFallback';
import { protectedRouteLoader } from '@/router/routes/loaders/accessLoaders';

import DashboardLayout from '@/layouts/DashboardLayout';

import { RootElement } from './AppRouterLayout';
import { routes, type AppRoute } from './routes/routes';

export const router = createBrowserRouter([
  {
    id: 'root',
    path: '/',
    element: <RootElement />,
    errorElement: <RouteErrorFallback />,
    children: (() => {
      const publicRoutes: AppRoute[] = [];
      const privateRoutes: AppRoute[] = [];

      routes.forEach((route) => {
        if (route.isPublic) {
          publicRoutes.push(route);
        } else {
          privateRoutes.push(route);
        }
      });

      return [
        {
          id: 'protected-app',
          element: <DashboardLayout />,
          loader: protectedRouteLoader,
          children: privateRoutes,
        },
        ...publicRoutes,
      ];
    })(),
  },
]);
