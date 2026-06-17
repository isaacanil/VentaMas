import { toMillis } from '@/utils/date/toMillis';

export interface AuthorizationRequest {
  id: string;
  key?: string;
  status: string;
  createdAt: any;
  note?: string;
  requestNote?: string;
  reference?: string;
  requestedBy?: any;
  module?: string;
  type?: string;
  metadata?: {
    module?: string;
  };
  collectionKey?: string;
  invoiceNumber?: string;
}

export const resolveRequestModule = (
  request: Partial<AuthorizationRequest> | undefined,
) => {
  if (!request || typeof request !== 'object') return 'authorizationRequests';

  const metadataModule =
    request.metadata &&
    typeof request.metadata === 'object' &&
    typeof request.metadata.module === 'string'
      ? request.metadata.module
      : null;

  return (
    (typeof request.module === 'string' && request.module) ||
    (typeof request.type === 'string' && request.type) ||
    metadataModule ||
    (typeof request.collectionKey === 'string' && request.collectionKey) ||
    'authorizationRequests'
  );
};

export const getAuthorizationTimestampMillis = (value: any) => {
  if (!value) return 0;
  if (typeof value === 'number') {
    return value > 1e12 ? value : value * 1000;
  }
  return toMillis(value) ?? 0;
};

export const sortAuthorizations = (items: AuthorizationRequest[]) =>
  (Array.isArray(items) ? items : []).slice().sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;

    const dateA = getAuthorizationTimestampMillis(a.createdAt);
    const dateB = getAuthorizationTimestampMillis(b.createdAt);
    return dateB - dateA;
  });
