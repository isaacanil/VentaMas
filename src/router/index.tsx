import { createBrowserRouter } from 'react-router';

import { RootElement } from './AppRouterLayout';
import { routes } from './routes/routes';


export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootElement />,
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
