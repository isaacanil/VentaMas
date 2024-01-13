import { collection, doc, writeBatch } from "firebase/firestore"
import { db } from "../firebaseconfig"
const BATCH_SIZE = 500; 
export const fbAddRncData = async (rncData) => {
    if(!rncData) return
    if(!rncData.length) return
    if(rncData.length === 0) return
    for (let i = 0; i < rncData.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const end = Math.min(i + BATCH_SIZE, rncData.length);

        for (let j = i; j < end; j++) {
            const docRef = doc(collection(db, "rncData"));  // Genera un nuevo documento con ID único
            batch.set(docRef, rncData[j]);
        }

        // Sube el lote actual
        await batch.commit();

        // Opcional: Mostrar progreso
        console.log(`Lote procesado: ${end} de ${rncData.length}`);
    }
};