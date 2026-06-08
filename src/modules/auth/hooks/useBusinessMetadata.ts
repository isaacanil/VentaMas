import { useEffect, useMemo, useState } from 'react';

import type { AvailableBusinessContext } from '@/utils/auth-adapter';

import { fetchBusinessMetadataMap } from '../repositories/businessMetadata.repository';
import type { BusinessMetadata } from '../utils/businessMetadata';

export const useBusinessMetadata = (
  businesses: AvailableBusinessContext[],
): Map<string, BusinessMetadata> => {
  const [metadataMap, setMetadataMap] = useState<Map<string, BusinessMetadata>>(
    new Map(),
  );
  const businessIdsKey = useMemo(
    () =>
      businesses
        .map((business) => business.businessId)
        .sort()
        .join(','),
    [businesses],
  );
  const businessIds = useMemo(
    () => (businessIdsKey ? businessIdsKey.split(',') : []),
    [businessIdsKey],
  );

  useEffect(() => {
    if (!businessIds.length) {
      return;
    }

    let cancelled = false;

    const fetchMetadata = async () => {
      const next = await fetchBusinessMetadataMap(businessIds);

      if (!cancelled) {
        setMetadataMap(next);
      }
    };

    void fetchMetadata();

    return () => {
      cancelled = true;
    };
  }, [businessIds]);

  if (!businessIds.length) {
    return new Map();
  }

  return metadataMap;
};

export default useBusinessMetadata;
