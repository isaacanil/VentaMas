import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  selectNcfType,
  selectTaxReceiptType,
} from '@/features/taxReceipt/taxReceiptSlice';
import { db } from '@/firebase/firebaseconfig';
import type { TaxReceiptDocument } from '@/types/taxReceipt';
import { serializeFirestoreDocuments } from '@/utils/serialization/serializeFirestoreData';
import { buildTaxReceiptDocument } from '@/utils/taxReceipt';

type TaxReceiptSnapshotState = {
  businessID: string | null;
  taxReceipt: TaxReceiptDocument[];
};

const EMPTY_TAX_RECEIPTS: TaxReceiptDocument[] = [];

// NOTE: This function uses React hooks; keep the `use*` prefix so tools like
// React Compiler and hook linting can reliably treat it as a hook.
export const useFbGetTaxReceipt = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const currentNcfType = useSelector(selectNcfType);

  const businessID = user?.businessID ?? null;
  const [snapshotState, setSnapshotState] = useState<TaxReceiptSnapshotState>({
    businessID: null,
    taxReceipt: [],
  });

  useEffect(() => {
    if (!businessID) {
      return undefined;
    }

    const taxReceiptsRef = collection(
      db,
      'businesses',
      businessID,
      'taxReceipts',
    );

    const unsubscribe = onSnapshot(
      taxReceiptsRef,
      (snapshot) => {
        const taxReceiptsArray = snapshot.docs.map(
          (item) => item.data() as TaxReceiptDocument,
        );
        const serializedTaxReceipts = serializeFirestoreDocuments(
          taxReceiptsArray as any,
        ) as unknown as TaxReceiptDocument[];
        setSnapshotState({
          businessID,
          taxReceipt: serializedTaxReceipts.map((item) =>
            buildTaxReceiptDocument(item.data),
          ),
        });
      },
      (error) => {
        console.error('Error fetching tax receipts: ', error);
        setSnapshotState({
          businessID,
          taxReceipt: [],
        });
      },
    );

    return () => unsubscribe();
  }, [businessID]);

  const isCurrentSnapshot = snapshotState.businessID === businessID;
  const taxReceipt =
    businessID && isCurrentSnapshot
      ? snapshotState.taxReceipt
      : EMPTY_TAX_RECEIPTS;
  const isLoading = Boolean(businessID) && !isCurrentSnapshot;

  useEffect(() => {
    if (!taxReceipt?.length) return;

    const defaultOption = taxReceipt.find(
      (item) => item.data?.name === 'CONSUMIDOR FINAL',
    );

    const availableTypes = taxReceipt
      .map((item) => item.data?.name)
      .filter(Boolean);

    const fallbackType = defaultOption?.data?.name || availableTypes[0] || null;

    const shouldSelectFallback =
      !currentNcfType ||
      (currentNcfType && !availableTypes.includes(currentNcfType));

    if (shouldSelectFallback && fallbackType) {
      dispatch(selectTaxReceiptType(fallbackType));
    }
  }, [taxReceipt, currentNcfType, dispatch]);

  return { taxReceipt, isLoading };
};

// Backwards-compat export (deprecated). Prefer `useFbGetTaxReceipt`.
export const fbGetTaxReceipt = useFbGetTaxReceipt;
