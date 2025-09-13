import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { selectUser } from "../../features/auth/userSlice";

export const useFbGetCreditNotesByInvoice = (invoiceId) => {
  const user = useSelector(selectUser);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.businessID || !invoiceId) {
      setCreditNotes([]);
      return;
    }

    setLoading(true);

    const ref = collection(db, "businesses", user.businessID, "creditNotes");
    const q = query(ref, where("invoiceId", "==", invoiceId));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => doc.data());
        setCreditNotes(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching credit notes by invoice:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.businessID, invoiceId]);

  return { creditNotes, loading };
}; 