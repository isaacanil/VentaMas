import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { db } from "../firebaseconfig";
import { selectUser } from "../../features/auth/userSlice";

export const useFbGetCashCount = (id) => {
    if(!id) { return null }
    const [cashCount, setCashCount] = useState(null)
    const user = useSelector(selectUser)
    const cashCountRef = doc(db, 'businesses', user.businessID, "cashCounts", id);

    useEffect(() => {
        if (!user || !user?.businessID) { return }
        const unsubscribe = onSnapshot(cashCountRef, (doc) => {
            const data = doc.data()
            setCashCount(data)
        })
        return unsubscribe
    }, [id])
    console.log(cashCount)
    return cashCount
}