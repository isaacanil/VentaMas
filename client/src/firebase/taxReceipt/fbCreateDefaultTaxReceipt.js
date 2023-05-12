import { useSelector } from "react-redux"
import { selectUser } from "../../features/auth/userSlice"
import { validateUser } from "../../utils/userValidation"
import { db } from "../firebaseconfig"
import { fbCreateTaxReceipt } from "./fbCreateTaxReceipt"


const FbCreateDefaultTaxReceipt = () => {
    const user = useSelector(selectUser);

    useEffect(() => {
        try {
            validateUser(user);
            const { businessID } = user;
           
            const taxReceiptRef = collection(db, "businesses", businessID, "taxReceipts");

            const unsubscribe = onSnapshot(taxReceiptRef, (data) => {
                const taxReceiptArray = data.docs.map(item => item.data());

                if (taxReceiptArray.length > 0) {
                    taxReceiptArray.forEach(item => {
                        fbCreateTaxReceipt(item);
                    });
                }
            });

            // Cleanup function to unsubscribe from the snapshot listener when the component unmounts
            return () => {
                unsubscribe();
            };
        } catch (error) {
            // Handle the error here
            console.error('Error in FbCreateDefaultTaxReceipt:', error);
        }
    }, [user]);

};

export default FbCreateDefaultTaxReceipt;