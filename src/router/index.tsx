import { createBrowserRouter } from 'react-router';

import { RouteErrorFallback } from '@/views/templates/system/ErrorComponent/RouteErrorFallback';

import { RootElement } from './AppRouterLayout';
import { routes } from './routes/routes';


export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootElement />,
    errorElement: <RouteErrorFallback />,
    children: routes.map(route => ({
      ...route,
      element: route.element,
      children: route.children ? route.children.map(child => ({
        ...child,
        element: child.element
      })) : undefined
    }))
  }
]);
