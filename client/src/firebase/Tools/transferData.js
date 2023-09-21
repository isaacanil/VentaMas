import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';



export async function transferDocs(user, oldCollectionName, newCollectionName) {
    if (!user || !user.businessID) return console.log('No user or businessID provided');
    const oldCollectionRef = collection(db, 'businesses', user?.businessID, oldCollectionName);
    const oldDocsSnapshot = await getDocs(oldCollectionRef);

    for (const docSnapshot of oldDocsSnapshot.docs) {
        const newDocRef = doc(db, 'businesses', user?.businessID, newCollectionName, docSnapshot.id);
        await setDoc(newDocRef, docSnapshot.data());
    }
}


