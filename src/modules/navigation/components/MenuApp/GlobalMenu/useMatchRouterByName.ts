import { useMatch, type PathMatch } from 'react-router-dom';

import findRouteByName from '@/modules/navigation/components/MenuApp/findRouteByName';

export const useMatchRouteByName = (
  routeName: string,
): PathMatch<string> | null => {
  const route = findRouteByName(routeName);
  const safePath = route?.path ?? '/__no_match__';
  const match = useMatch(safePath);
  return route?.path ? match : null;
};
