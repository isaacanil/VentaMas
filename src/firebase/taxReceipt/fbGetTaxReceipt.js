import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import {
  selectNcfType,
  selectTaxReceiptType,
} from '../../features/taxReceipt/taxReceiptSlice';
import { serializeFirestoreDocuments } from '../../utils/serialization/serializeFirestoreData';
import { db } from '../firebaseconfig';

export const fbGetTaxReceipt = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const currentNcfType = useSelector(selectNcfType);

  const [taxReceipt, setTaxReceipt] = useState([]);
  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    let unsubscribe;

    // Siempre iniciamos cargando
    setLoading(true);

    if (!user || !user.businessID) {
      setTaxReceipt([]);
      setLoading(false);
      return;
    }

    try {
      const taxReceiptsRef = collection(
        db,
        'businesses',
        user.businessID,
        'taxReceipts',
      );
      unsubscribe = onSnapshot(
        taxReceiptsRef,
        (snapshot) => {
          const taxReceiptsArray = snapshot.docs.map((item) => item.data());
          const serializedTaxReceipts =
            serializeFirestoreDocuments(taxReceiptsArray);
          setTaxReceipt(serializedTaxReceipts);
          const defaultOption = serializedTaxReceipts.find(
            (item) => item.data.name === 'CONSUMIDOR FINAL',
          );
          const availableTypes = serializedTaxReceipts
            .map((item) => item.data.name)
            .filter(Boolean);
          const fallbackType =
            defaultOption?.data?.name || availableTypes[0] || null;

          const shouldSelectFallback =
            !currentNcfType ||
            (currentNcfType && !availableTypes.includes(currentNcfType));

          if (shouldSelectFallback && fallbackType) {
            dispatch(selectTaxReceiptType(fallbackType));
          }
          setLoading(false); // Set loading to false after data is fetched
        },
        (error) => {
          console.error('Error fetching tax receipts: ', error);
          setLoading(false);
          setTaxReceipt([]);
        },
      );
    } catch (error) {
      console.error('Exception in tax receipts fetch: ', error);
      setLoading(false);
      setTaxReceipt([]);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, dispatch, currentNcfType]);

  return { taxReceipt, isLoading };
};
