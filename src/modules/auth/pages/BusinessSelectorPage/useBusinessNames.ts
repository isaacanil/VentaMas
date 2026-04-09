import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { AvailableBusinessContext } from '@/utils/auth-adapter';

/**
 * Fetches the real business name from Firestore for each business in the list.
 * Returns a Map<businessId, name> that can be used to enrich the displayed name.
 */
export const useBusinessNames = (
    businesses: AvailableBusinessContext[],
): Map<string, string> => {
    const [namesMap, setNamesMap] = useState<Map<string, string>>(new Map());

    // Create a stable key from business IDs to avoid unnecessary re-fetches.
    const businessIdsKey = businesses.map((b) => b.businessId).sort().join(',');

    useEffect(() => {
        if (!businesses.length) {
            setNamesMap(new Map());
            return;
        }

        let cancelled = false;

        const fetchNames = async () => {
            const results = new Map<string, string>();

            await Promise.all(
                businesses.map(async (business) => {
                    try {
                        const businessRef = doc(db, 'businesses', business.businessId);
                        const snapshot = await getDoc(businessRef);

                        if (!snapshot.exists()) return;

                        const data = snapshot.data();
                        const businessData =
                            data && typeof data === 'object' ? data : null;
                        const nestedBusiness =
                            businessData &&
                                typeof businessData.business === 'object' &&
                                businessData.business !== null
                                ? (businessData.business as Record<string, unknown>)
                                : null;

                        const name =
                            (nestedBusiness &&
                                typeof nestedBusiness.name === 'string' &&
                                nestedBusiness.name.trim()) ||
                            null;

                        if (name) {
                            results.set(business.businessId, name);
                        }
                    } catch {
                        // Silently ignore individual fetch errors.
                    }
                }),
            );

            if (!cancelled) {
                setNamesMap(results);
            }
        };

        void fetchNames();

        return () => {
            cancelled = true;
        };
        // eslint_disable-next-line react-hooks/exhaustive-deps
    }, [businessIdsKey]);

    return namesMap;
};
