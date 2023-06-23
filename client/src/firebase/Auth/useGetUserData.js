import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

import { addUserData } from "../../features/auth/userSlice";
import { useDispatch } from "react-redux";
import { useEffect } from "react";

export const useGetUserData = (uid) => {
   
    const dispatch = useDispatch();
    const fbGetUserData = async () => {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const businessRef = userSnap.data();
            dispatch(addUserData({
                businessID: businessRef.user.businessID,
                role: businessRef.user.role
            }));
        } else {
            console.log("No such document!");
        }
    };
    useEffect(() => {
        if (uid) { fbGetUserData(); }
    }, [uid]);
};

export default useGetUserData;