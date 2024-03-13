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
                const changelogArray = snapshot.docs.map(doc => {
                    const data = doc.data()
                    const createdAt = new Date(data?.changelog?.createdAt.seconds * 1000)
                    return {
                        ...data, changelog: {
                            ...data.changelog,
                            createdAt: createdAt
                        }
                    }
                })
                setChangelogs(changelogArray)
            })
            return () => unsubscribe();
        } catch (error) {
            setError(error);
        }
    }, [])
    return { changelogs, error };
}