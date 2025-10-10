import { Timestamp, doc, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";

import { fbUpdateAppVersion } from "../app/fbUpdateAppVersion";
import { db } from "../firebaseconfig";

export const fbAddChangelog = async (jsonString) => {
    let changelog = {
        id: nanoid(12),
        content: jsonString,
        createdAt: Timestamp.now(),
    }
    try {
        const ChangeLogCol = doc(db, "changelogs", changelog.id); 
        await setDoc(ChangeLogCol, { changelog });
        await fbUpdateAppVersion(changelog?.id)

    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
};