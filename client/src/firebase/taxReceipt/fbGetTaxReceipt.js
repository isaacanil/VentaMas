import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbCreateTaxReceipt } from "./fbCreateTaxReceipt";
import { useSelector } from "react-redux";
import { selectUser } from "../../features/auth/userSlice";
import { validateUser } from "../../utils/userValidation";
import { useEffect, useState } from "react";
import { taxReceiptDefault } from "./taxReceiptsDefault";

export const fbGetTaxReceipt = () => {
  const [taxReceipt, setTaxReceipt] = useState([]);
  const user = useSelector(selectUser);

  useEffect(() => {
    try {
      validateUser(user);
      const { businessID } = user;
      const taxReceiptsRef = collection(db, "businesses", businessID, "taxReceipts");

      const unsubscribe = onSnapshot(taxReceiptsRef, (snapshot) => {
        let taxReceiptsArray = snapshot.docs.map(item => item.data());
        setTaxReceipt(taxReceiptsArray);
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.log(error);
    }
  }, [user]);

  return { taxReceipt };
};
