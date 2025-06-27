import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../features/auth/userSlice";
import { useEffect, useState } from "react";
import { selectTaxReceiptType } from "../../features/taxReceipt/taxReceiptSlice";
import { serializeFirestoreDocuments } from "../../utils/serialization/serializeFirestoreData";

export const fbGetTaxReceipt = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

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
      const taxReceiptsRef = collection(db, "businesses", user.businessID, "taxReceipts");
      unsubscribe = onSnapshot(
        taxReceiptsRef,
        (snapshot) => {
          const taxReceiptsArray = snapshot.docs.map(item => item.data());
          const serializedTaxReceipts = serializeFirestoreDocuments(taxReceiptsArray);
          setTaxReceipt(serializedTaxReceipts);
          const defaultOption = serializedTaxReceipts.find(item => item.data.name === 'CONSUMIDOR FINAL');
          dispatch(selectTaxReceiptType(defaultOption?.data.name));
          setLoading(false); // Set loading to false after data is fetched
        },
        (error) => {
          console.error("Error fetching tax receipts: ", error);
          setLoading(false);
          setTaxReceipt([]);
        }
      );
    } catch (error) {
      console.error("Exception in tax receipts fetch: ", error);
      setLoading(false);
      setTaxReceipt([]);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, dispatch]);

  return { taxReceipt, isLoading };
};
