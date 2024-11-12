import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../features/auth/userSlice";
import { validateUser } from "../../utils/userValidation";
import { useEffect, useState } from "react";
import { selectTaxReceiptType } from "../../features/taxReceipt/taxReceiptSlice";

export const fbGetTaxReceipt = () => {
  const [taxReceipt, setTaxReceipt] = useState([]);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  useEffect(() => {
    try {
      if(!user.businessID){
        setTaxReceipt([]);
        return
      }
      const { businessID } = user;
      const taxReceiptsRef = collection(db, "businesses", businessID, "taxReceipts");

      const unsubscribe = onSnapshot(taxReceiptsRef, (snapshot) => {
        let taxReceiptsArray = snapshot.docs.map(item => item.data());
        setTaxReceipt(taxReceiptsArray);
        const defaultOption = taxReceiptsArray.find(item => item.data.name === 'CONSUMIDOR FINAL')
        dispatch(selectTaxReceiptType(defaultOption.data.name))
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
