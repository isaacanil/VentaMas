import { useEffect, useState } from "react";
import { db } from "../firebaseconfig";
import { useSelector } from "react-redux";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { UserValidationError, validateUser } from "../../utils/userValidation";
import { selectUser } from "../../features/auth/userSlice";

export const fbGetInvoices = (time) => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const user = useSelector(selectUser);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        validateUser(user);
        const { businessID, uid, role } = user;

        const start = new Date(time.startDate);
        const end = new Date(time.endDate);
        const restrictionStartDate = new Date('2024-02-19');

        const invoicesRef = collection(db, "businesses", businessID, "invoices");
        
        let q;
        if (new Date() >= restrictionStartDate) {
          // Comprobación de la fecha para aplicar la restricción
          if (role === 'admin' || role === 'owner' || role === 'dev') {
            // Si el usuario es admin y la fecha actual es posterior al 21/02/2024
            q = query(invoicesRef,
              where("data.date", ">=", start),
              where("data.date", "<=", end),
              orderBy("data.date", "desc"),
            );
          } else {
            // Si el usuario no es admin y la fecha actual es posterior al 21/02/2024
            q = query(invoicesRef,
              where("data.date", ">=", start),
              where("data.date", "<=", end),
              where("userId", "==", uid),
              orderBy("data.date", "desc"),
            );
          }
        } else {
          // Si la fecha actual es anterior al 21/02/2024, aplicar lógica anterior (sin restricciones basadas en el rol)
          q = query(invoicesRef,
            where("data.date", ">=", start),
            where("data.date", "<=", end),
            orderBy("data.date", "desc"),
          );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
            setInvoices([]);
            setLoading(false);
            return;
          }
          const data = snapshot.docs.map(item => item.data())
          .filter(item => item.data.status !== 'cancelled');
        
          setInvoices(data);
          setLoading(false);
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error("Error fetching invoices:", error);
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [time, user]);

  return { invoices, loading };
};