import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { addUserData } from "../../features/auth/userSlice";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const fetchUserData = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data();
    } else {
        throw new Error("No such document!");
    }
};

export const useGetUserData = (uid) => {
    const dispatch = useDispatch();

    const { data, error, isLoading, isFetching, isError } = useQuery({
        queryKey: ['userData', uid],
        queryFn: () => fetchUserData(uid),
        enabled: !!uid,  
    });

    useEffect(() => {
        if (data) {
            dispatch(addUserData({
                businessID: data?.user?.businessID,
                role: data?.user?.role
            }));
        }
        if (isError) {
            console.error("Error fetching user data:", error);
        }
    }, [data, isError]);

    return { data, error, isLoading, isFetching };
};

export default useGetUserData;
