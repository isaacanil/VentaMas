import ROUTES_NAME from '@/router/routes/routesName';
import { toCleanString } from '@/utils/text';

export const ACCOUNT_RECEIVABLE_DETAIL_QUERY_PARAM = 'arId';

export const buildAccountReceivableListUrl = (
  arId?: string | null,
): string => {
  const basePath = ROUTES_NAME.ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_LIST;
  const nextArId = toCleanString(arId);

  if (!nextArId) {
    return basePath;
  }

  const searchParams = new URLSearchParams({
    [ACCOUNT_RECEIVABLE_DETAIL_QUERY_PARAM]: nextArId,
  });

  return `${basePath}?${searchParams.toString()}`;
};
