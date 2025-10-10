import { collection, onSnapshot, runTransaction, doc, serverTimestamp, getDocs } from "firebase/firestore";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectUser } from "../../features/auth/userSlice";
import { getTaxReceiptData } from "../../features/taxReceipt/taxReceiptSlice";
import { serializeFirestoreDocuments } from "../../utils/serialization/serializeFirestoreData";
import { validateUser } from "../../utils/userValidation";
import { db } from "../firebaseconfig";

import { removeDuplicateTaxReceipts } from "./removeDuplicateTaxReceipts";
import { taxReceiptDefault } from "./taxReceiptsDefault";


export const fbAutoCreateDefaultTaxReceipt = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
  
    useEffect(() => {
      if (!user || !user.businessID) return;
  
      const taxReceiptsRef = collection(db, "businesses", user.businessID, "taxReceipts");
  
      const unsubscribe = onSnapshot(taxReceiptsRef, async (snapshot) => {
        // Si hay documentos, primero eliminamos duplicados
        if (!snapshot.empty) {
          try {
            await removeDuplicateTaxReceipts(user.businessID);
          } catch (err) {
            console.error("Error al eliminar duplicados:", err);
          }
        } else {
          // Si la colección está vacía, crear los recibos fiscales por defecto
          try {
            // Primero verificamos cuáles comprobantes ya existen para no sobrescribirlos
            const existingReceipts = new Set();
            const existingSnapshot = await getDocs(taxReceiptsRef);
            existingSnapshot.forEach(doc => {
              if (doc.data().data && doc.data().data.serie) {
                existingReceipts.add(doc.data().data.serie);
              }
            });

            await runTransaction(db, async (transaction) => {
              // Primero hacemos todas las lecturas
              const docRefs = [];
              const docSnapshots = [];
              
              for (const item of taxReceiptDefault) {
                // Verificamos si este comprobante ya existe
                if (!existingReceipts.has(item.serie)) {
                  const serie = item.serie;
                  const taxReceiptRef = doc(db, "businesses", user.businessID, "taxReceipts", serie);
                  docRefs.push({ ref: taxReceiptRef, item });
                  const docSnapshot = await transaction.get(taxReceiptRef);
                  docSnapshots.push(docSnapshot);
                }
              }
              
              // Después hacemos todas las escrituras
              validateUser(user);
              docRefs.forEach((docRef, index) => {
                if (!docSnapshots[index].exists()) {
                  console.log("Creando recibo fiscal con serie:", docRef.item.serie);
                  transaction.set(docRef.ref, {
                    data: { 
                      ...docRef.item, 
                      id: docRef.item.serie, 
                      createdAt: serverTimestamp() 
                    },
                  });
                }
              });
            });
            console.log("Los recibos fiscales por defecto fueron creados o ya existían.");
          } catch (err) {
            console.error("Error en la transacción al crear los recibos por defecto:", err);
          }
          return; // Finalizamos si se crearon los documentos por defecto
        }        // Luego, actualizamos el estado con la data (ya limpia de duplicados)
        const taxReceiptsArray = snapshot.docs.map((doc) => doc.data());
        const serializedTaxReceipts = serializeFirestoreDocuments(taxReceiptsArray);
        dispatch(getTaxReceiptData(serializedTaxReceipts));
      });
  
      return () => {
        unsubscribe();
      };
    }, [user, dispatch]);
  
    return null;
  };
