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

const toMillis = (value: any) => {
  if (!value) return 0;
  if (typeof value === 'number') {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
};

export const sortAuthorizations = (items: AuthorizationRequest[]) =>
  (Array.isArray(items) ? items : []).slice().sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;

    const dateA = toMillis(a.createdAt);
    const dateB = toMillis(b.createdAt);
    return dateB - dateA;
  });
