import { getProviderDoc } from './providerRefs';
import { getDocFromRef } from '@/utils/referenceUtils';

export const getProviderPayloadById = async (
  businessId: string,
  providerId: string | null | undefined,
): Promise<Record<string, unknown>> => {
  if (!providerId) return {};

  const providerDoc = await getDocFromRef(getProviderDoc(businessId, providerId));
  return (providerDoc?.provider ?? {}) as Record<string, unknown>;
};
