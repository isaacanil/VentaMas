import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { selectUser } from "../../features/auth/userSlice";
import { validateUser } from "../../utils/userValidation";
import { db } from "../firebaseconfig";

const getSerieBounds = (serie) => {
  if (!serie) return null;
  const normalized = serie.toUpperCase();

  const lastChar = normalized.charCodeAt(normalized.length - 1);
  const nextChar = String.fromCharCode(lastChar + 1);
  const upperBound = `${normalized.slice(0, -1)}${nextChar}`;

  return {
    normalized,
    start: normalized,
    end: upperBound,
  };
};

export const useFbGetInvoicesBySerie = (serie, { includeCancelled = false } = {}) => {
  const user = useSelector(selectUser);
  const [state, setState] = useState({ invoices: [], loading: true, error: null });

  const bounds = useMemo(() => getSerieBounds(serie), [serie]);

  useEffect(() => {
    if (!user?.businessID || !bounds?.normalized) {
      setState({ invoices: [], loading: false, error: null });
      return;
    }

    let unsubscribe = null;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const fetchInvoices = async () => {
      try {
        validateUser(user);
        const invoicesRef = collection(db, "businesses", user.businessID, "invoices");

        const q = query(
          invoicesRef,
          where("data.NCF", ">=", bounds.start),
          where("data.NCF", "<", bounds.end),
          orderBy("data.NCF", "asc")
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const rawInvoices = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            const filtered = rawInvoices.filter((invoice) => {
              const ncf = invoice?.data?.NCF || invoice?.NCF || "";
              if (!ncf) return false;
              if (!ncf.toUpperCase().startsWith(bounds.normalized)) return false;
              if (!includeCancelled && invoice?.data?.status === "cancelled") return false;
              return true;
            });

            setState({ invoices: filtered, loading: false, error: null });
          },
          (error) => {
            console.error("Error listening invoices by serie:", error);
            setState({ invoices: [], loading: false, error });
          }
        );
      } catch (error) {
        console.error("Error fetching invoices by serie:", error);
        setState({ invoices: [], loading: false, error });
      }
    };

    fetchInvoices();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.businessID, bounds?.normalized, includeCancelled, bounds?.start, bounds?.end, user]);

  return state;
};
