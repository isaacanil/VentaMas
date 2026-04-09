import ROUTES_NAME from '@/router/routes/routesName';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';

export const resolveDefaultHomeRoute = (user: unknown): string => {
  if (hasDeveloperAccess(user)) {
    return ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB;
  }
  return ROUTES_NAME.BASIC_TERM.HOME;
};
