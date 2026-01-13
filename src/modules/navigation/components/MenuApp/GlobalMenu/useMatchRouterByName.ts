import { useMatch, type PathMatch } from 'react-router-dom';

import findRouteByName from '@/modules/navigation/components/MenuApp/findRouteByName';

export const useMatchRouteByName = (
  routeName: string,
): PathMatch<string> | null => {
  const route = findRouteByName(routeName);
  if (!route?.path) return null;
  return useMatch(route.path);
};

