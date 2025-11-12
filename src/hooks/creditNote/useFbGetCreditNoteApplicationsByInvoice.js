import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectUser } from "../../features/auth/userSlice";
import { db } from "../../firebase/firebaseconfig";

/**
 * Hook para obtener aplicaciones de notas de crédito por factura
 * @param {string} invoiceId - ID de la factura
 * @returns {Object} - { applications, loading }
 */
export const useFbGetCreditNoteApplicationsByInvoice = (invoiceId) => {
  const user = useSelector(selectUser);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.businessID || !invoiceId) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const applicationsRef = collection(db, "businesses", user.businessID, "creditNoteApplications");
    const q = query(
      applicationsRef,
      where("invoiceId", "==", invoiceId),
      orderBy("appliedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        }));
        setApplications(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching credit note applications by invoice:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.businessID, invoiceId]);

  return { applications, loading };
}; 