import { collection, getDocs, writeBatch, query, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { fbLoadInvoicesForCashCount } from './fbLoadInvoicesForCashCount';
import { CashCountMetaData } from '../../views/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData';

// Esta función recorre todos los negocios y actualiza los cuadres de caja en cada uno
export const fbUpdateAllBusinessCashCounts = async () => {
  console.log("Starting to update all business cash counts.");
  try {
    const businesses = await getBusinesses();
    console.log(`Retrieved ${businesses.length} businesses to process.`);
    
    for (const businessId of businesses) {
      console.log(`Processing business with ID: ${businessId}`);
      try {
        const cashCountsRef = collection(db, `businesses/${businessId}/cashCounts`);
        const cashCountsSnapshot = await getDocs(cashCountsRef);
        console.log(`Found ${cashCountsSnapshot.docs.length} cash counts for business ID: ${businessId}`);
        
        for (const cashCountDoc of cashCountsSnapshot.docs) {
          console.log(`Processing cash count with ID: ${cashCountDoc.id} for business ID: ${businessId}`);
          try {
            const cashCountID = cashCountDoc.id;
            const cashCount = cashCountDoc.data().cashCount;
            const user  = { businessID: businessId };
            console.log(`Loading invoices for cash count ID: ${cashCountID}`);
            const invoices = await fbLoadInvoicesForCashCount(user, cashCountID, 'invoices');
            
            console.log(`Calculating metadata for cash count ID: ${cashCountID}`);
            const cashCountMetaData = CashCountMetaData(cashCount, invoices);
            if(cashCountMetaData){
              await updateCashCountWithMetaData(businessId, cashCountID, cashCountMetaData);
              console.log(`Cash count ID: ${cashCountID} for business ID: ${businessId} updated successfully.`);
            } else {
              console.log(`No metadata calculated for cash count ID: ${cashCountID}, skipping update.`);
            }
          } catch (error) {
            console.error(`Error processing cash count ${cashCountDoc.id} for business ${businessId}: ${error}`);
          }
        }
      } catch (error) {
        console.error(`Error processing businesses ${businessId}: ${error}`);
      }
    }
    console.log("Finished updating all business cash counts.");
  } catch (error) {
    console.error(`Error retrieving businesses: ${error}`);
  }
};



const getBusinesses = async () => {
  const businessRef = collection(db, 'businesses');
  const businessSnapshot = await getDocs(businessRef);
  return businessSnapshot.docs.map((doc) => doc.id);
}
const updateCashCountWithMetaData = async (businessId, cashCountID, metaData) => {
  const cashCountRef = doc(db, `businesses/${businessId}/cashCounts`, cashCountID);
  
  // Obtiene el documento actual para poder combinar los datos existentes con los nuevos metadatos
  const cashCountDoc = await getDoc(cashCountRef);
  if (cashCountDoc.exists()) {
    const existingData = cashCountDoc.data().cashCount; // Suponiendo que 'cashCount' es el objeto que contiene los datos existentes
    
    // Combinar los datos existentes con los nuevos metadatos
    const updatedData = {
      ...existingData, // Mantiene los datos existentes
      ...metaData // Añade o actualiza los metadatos calculados
    };
    
    // Actualiza el documento de cashCount con los datos combinados
    await updateDoc(cashCountRef, { cashCount: updatedData });
    console.log(`CashCount ${cashCountID} updated successfully.`);
  } else {
    console.error(`No cashCount found with ID ${cashCountID}`);
  }
};
