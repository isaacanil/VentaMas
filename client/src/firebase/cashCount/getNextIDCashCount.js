import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const getNextIdCashCount = async (user) => {
  if(!user || !user?.businessID) { return }

  const lastIdRef = doc(db,'businesses', user?.businessID, 'metadata', 'lastCashCountId');
  let lastIdDoc;

  try {
    lastIdDoc = await getDoc(lastIdRef);

    if (lastIdDoc.exists()) {
      // Incrementa el valor y obtén el nuevo valor
      await updateDoc(lastIdRef, { value: increment(1) });
      lastIdDoc = await getDoc(lastIdRef);

      // Regresa el nuevo valor
      return lastIdDoc.data().value;

    } else {
      // Establece el documento con un valor inicial de 1
      await setDoc(lastIdRef, { value: 1 });

      // Regresa 1 como primer ID
      return 1;
    }

  } catch (error) {
    console.error('Error updating last ID: ', error);
    throw error;  // Lanza el error para detener la ejecución
  }
}

 
  
  
  
  
  
  