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
          const { businessID } = user;
          const start = new Date(time.startDate);
          const end = new Date(time.endDate);
          const invoicesRef = collection(db, "businesses", businessID, "invoices");
          const q = query(invoicesRef, where("data.date", ">=", start), where("data.date", "<=", end), orderBy("data.date", "desc"));
  
          const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
              setInvoices([]);
              setLoading(false);
              return;
            }
            const data = snapshot.docs.map(item => item.data());
            setInvoices(data);
            setLoading(false);
          });
  
          return () => {
            unsubscribe();
          };
        } catch (error) {
          if (error instanceof UserValidationError) {
          
          } else {
            throw error;
          }
        }
      };
  
      fetchInvoices();
    }, [time, user]);
    console.log(invoices)
    return { invoices, loading, setLoading };
  };