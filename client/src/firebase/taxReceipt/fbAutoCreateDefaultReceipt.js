import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { fbCreateTaxReceipt } from "./fbCreateTaxReceipt";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../features/auth/userSlice";
import { validateUser } from "../../utils/userValidation";
import { useEffect, useState } from "react";
import { taxReceiptDefault } from "./taxReceiptsDefault";
import { getTaxReceiptData } from "../../features/taxReceipt/taxReceiptSlice";

export const fbAutoCreateDefaultTaxReceipt = () => {
    const [taxReceipt, setTaxReceipt] = useState([]);
    const user = useSelector(selectUser);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!user || !user.businessID) return;
        const taxReceiptsRef = collection(db, "businesses", user.businessID, "taxReceipts");
        const unsubscribe = onSnapshot(taxReceiptsRef, (snapshot) => {
            if (snapshot.empty) {
                taxReceiptDefault.forEach(item => {
                    fbCreateTaxReceipt(item, user);
                });
                return;
            }
            let taxReceiptsArray = snapshot.docs.map(item => item.data());
            setTaxReceipt(taxReceiptsArray);
            dispatch(getTaxReceiptData(taxReceiptsArray));
        });

        return () => {
            unsubscribe();
        };
    }, [user, dispatch]);

    return null;
};

