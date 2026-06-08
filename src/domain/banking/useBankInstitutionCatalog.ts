import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import {
  DEFAULT_BANK_INSTITUTION_COUNTRY_CODE,
  normalizeBankInstitutionCatalogRecord,
  normalizeBankInstitutionCountryCode,
  sortBankInstitutionCatalog,
  type BankInstitutionCatalogEntry,
} from './bankInstitutionCatalog';

interface BankInstitutionCatalogState {
  entries: BankInstitutionCatalogEntry[];
  error: string | null;
  key: string | null;
}

const EMPTY_CATALOG_ENTRIES: BankInstitutionCatalogEntry[] = [];

export const useBankInstitutionCatalog = (
  countryCode: string | null | undefined = DEFAULT_BANK_INSTITUTION_COUNTRY_CODE,
  enabled = true,
) => {
  const normalizedCountryCode =
    normalizeBankInstitutionCountryCode(countryCode);
  const [state, setState] = useState<BankInstitutionCatalogState>({
    entries: [],
    error: null,
    key: null,
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const catalogQuery = query(
      collection(db, 'bankInstitutionCatalog'),
      where('countryCode', '==', normalizedCountryCode),
    );

    const unsubscribe = onSnapshot(
      catalogQuery,
      (snapshot) => {
        const nextEntries = sortBankInstitutionCatalog(
          snapshot.docs
            .map((catalogDoc) =>
              normalizeBankInstitutionCatalogRecord(
                catalogDoc.id,
                catalogDoc.data(),
              ),
            )
            .filter(
              (entry): entry is BankInstitutionCatalogEntry =>
                entry !== null && entry.status !== 'inactive',
            ),
        );

        setState({
          entries: nextEntries,
          error: null,
          key: normalizedCountryCode,
        });
      },
      (cause) => {
        console.error('Error cargando catalogo bancario:', cause);
        setState({
          entries: [],
          error: cause.message || 'No se pudo cargar el catalogo bancario.',
          key: normalizedCountryCode,
        });
      },
    );

    return unsubscribe;
  }, [enabled, normalizedCountryCode]);

  return useMemo(
    () => ({
      countryCode: normalizedCountryCode,
      entries:
        enabled && state.key === normalizedCountryCode
          ? state.entries
          : EMPTY_CATALOG_ENTRIES,
      error:
        enabled && state.key === normalizedCountryCode ? state.error : null,
      hasEntries:
        (enabled && state.key === normalizedCountryCode
          ? state.entries
          : EMPTY_CATALOG_ENTRIES
        ).length > 0,
      loading: enabled ? state.key !== normalizedCountryCode : false,
    }),
    [enabled, normalizedCountryCode, state.entries, state.error, state.key],
  );
};
