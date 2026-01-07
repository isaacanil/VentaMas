// @ts-nocheck
import { useMatch } from 'react-router-dom';

import findRouteByName from '@/views/templates/MenuApp/findRouteByName';

export const useMatchRouteByName = (routeName) => {
  const route = findRouteByName(routeName);
  const match = useMatch(route?.path);
  return match;
};
