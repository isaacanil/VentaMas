import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbGetAppVersion = async () => {
    const appRef = doc(db, 'app', '3Iz5UZWWfF4vCJPlDSy1');
    const appSnap = await getDoc(appRef);
    const appData = appSnap.data();
    
    return appData;
}