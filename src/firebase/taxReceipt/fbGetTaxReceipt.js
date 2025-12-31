import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  selectNcfType,
  selectTaxReceiptType,
} from '@/features/taxReceipt/taxReceiptSlice';
import { db } from '@/firebase/firebaseconfig';
import { serializeFirestoreDocuments } from '@/utils/serialization/serializeFirestoreData';

// NOTE: This function uses React hooks; keep the `use*` prefix so tools like
// React Compiler and hook linting can reliably treat it as a hook.
export const useFbGetTaxReceipt = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const currentNcfType = useSelector(selectNcfType);

  const [taxReceipt, setTaxReceipt] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const businessID = user?.businessID;
  const [prevBusinessID, setPrevBusinessID] = useState(businessID);

  // PATRÓN RECOMENDADO REACT: Ajustar estado durante render al cambiar businessID
  if (businessID !== prevBusinessID) {
    setPrevBusinessID(businessID);
    setTaxReceipt([]);
    if (businessID) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

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
        const taxReceiptsArray = snapshot.docs.map((item) => item.data());
        const serializedTaxReceipts =
          serializeFirestoreDocuments(taxReceiptsArray);
        setTaxReceipt(serializedTaxReceipts);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching tax receipts: ', error);
        setLoading(false);
        setTaxReceipt([]);
      },
    );

    return () => unsubscribe();
  }, [businessID]);

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
