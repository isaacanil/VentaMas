import { Timestamp, collection, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { nanoid } from "nanoid";

export const fbAddChangelog = async (jsonString) => {
    let changelog = {
        id: nanoid(12),
        content: jsonString,
        createdAt: Timestamp.now(),
    }
    try {
        const ChangeLogCol = doc(db, "changelogs", changelog.id); 
        await setDoc(ChangeLogCol, { changelog });
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
};