import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectUser } from "../../features/auth/userSlice";
import { db } from "../../firebase/firebaseconfig";

/**
 * Hook para obtener aplicaciones de notas de crédito
 * Estructura simplificada de aplicación:
 * {
 *   creditNoteId, creditNoteNcf,
 *   invoiceId, invoiceNcf, invoiceNumber,
 *   clientId, amountApplied,
 *   previousBalance, newBalance,
 *   appliedAt, appliedBy
 * }
 * @param {Object} filters - Filtros para la consulta
 * @param {string} filters.creditNoteId - ID de la nota de crédito
 * @param {string} filters.invoiceId - ID de la factura
 * @param {string} filters.clientId - ID del cliente
 * @returns {Object} - { applications, loading }
 */
export const useFbGetCreditNoteApplications = (filters = {}) => {
  const user = useSelector(selectUser);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.businessID) {
      setApplications([]);
      setLoading(false);
      return;
    }

    // Si no hay filtros, no hacer consulta
    if (!filters.creditNoteId && !filters.invoiceId && !filters.clientId) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const applicationsRef = collection(db, "businesses", user.businessID, "creditNoteApplications");
    
    // Construir la consulta con filtros dinámicos
    let queryConstraints = [orderBy("appliedAt", "desc")];

    // Filtro por nota de crédito
    if (filters.creditNoteId) {
      queryConstraints.push(where("creditNoteId", "==", filters.creditNoteId));
    }

    // Filtro por factura
    if (filters.invoiceId) {
      queryConstraints.push(where("invoiceId", "==", filters.invoiceId));
    }

    // Filtro por cliente
    if (filters.clientId) {
      queryConstraints.push(where("clientId", "==", filters.clientId));
    }

    const q = query(applicationsRef, ...queryConstraints);

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
        console.error("Error fetching credit note applications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.businessID, filters.creditNoteId, filters.invoiceId, filters.clientId]);

  return { applications, loading };
}; 