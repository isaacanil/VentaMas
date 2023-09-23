import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { useEffect, useState } from "react";

export const useGetChangelogs = () => {
    const [changelogs, setChangelogs] = useState([]);
    const [error, setError] = useState("")
    useEffect(() => {
        try {
            const changelogsRef = collection(db, "changelogs")
            const unsubscribe = onSnapshot(changelogsRef, snapshot => {
                const changelogArray = snapshot.docs.map(doc => doc.data())
                setChangelogs(changelogArray)
            })
            return () => unsubscribe();
        } catch (error) {
            setError(error);
        }
    }, [])
    return { changelogs, error };
}