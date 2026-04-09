import type { Authorizer } from '../types';

export const resolveAuthorizerName = (authorizer?: Authorizer | null) =>
  authorizer?.displayName ||
  authorizer?.name ||
  authorizer?.username ||
  authorizer?.email ||
  authorizer?.uid ||
  'usuario autorizado';

