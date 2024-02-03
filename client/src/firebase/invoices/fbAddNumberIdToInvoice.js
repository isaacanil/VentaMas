
import { db } from "../firebaseconfig";
import { writeBatch, collection, query, orderBy, getDocs, doc, setDoc, runTransaction } from 'firebase/firestore';

async function updateInvoicesInBatches(businessID) {
    console.log(`Iniciando la actualización de facturas para el negocio con ID: ${businessID}`);
    
    const invoicesRef = collection(db, 'businesses', businessID, 'invoices');
    const q = query(invoicesRef, orderBy('data.date'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        console.log(`No se encontraron facturas para el negocio con ID: ${businessID}`);
        return;
    }

    console.log(`Se encontraron ${querySnapshot.size} facturas para el negocio con ID: ${businessID}`);

    let counter = 1;
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalUpdated = 0;

    for (const docSnapshot of querySnapshot.docs) {
        if (batchCount >= 500) {
            await batch.commit();
            console.log(`Progreso negocio ${businessID}: ${totalUpdated}/${querySnapshot.size}`);
            batch = writeBatch(db);
            batchCount = 0;
        }

        const docRef = doc(db, 'businesses', businessID, 'invoices', docSnapshot.id);
        batch.update(docRef, { 'data.numberID': counter });
        counter++;
        batchCount++;
        totalUpdated++;
    }

    if (batchCount > 0) {
        await batch.commit();
        console.log(`Progreso negocio ${businessID}: ${totalUpdated}/${querySnapshot.size}`);
    }

    await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "businesses", businessID, 'counters', 'lastInvoiceId');
        transaction.set(counterRef, { value: counter - 1 });
    });

    console.log(`Actualización completada para el negocio con ID: ${businessID}`);
}
const businessIDs = [
    'EDW44d69fhdvE5QmuL2I',
    'G5dFfupqbgUg8tYEqc9o',
    'JnKRSCFwKSkiSNSiIpOM',
    'Lm8GG6YXQJO3zgR9DkGe',
    'TRNykpxKa580PqGc0GtI',
    'X63aIFwHzk3r0gmT8w6P',
    'tGrRrpnKl2D1ZezyBVQe',
    'vDR3rHX3GDLVnAnorAYz',
    'vvRKlKT9UOK4fX9FgJxN'
];
// const businessIDs = [
   
//     'X63aIFwHzk3r0gmT8w6P',
 
// ];
// Función para procesar varios negocios, asumiendo que cada uno puede tener más de 500 facturas
export async function fbAddNumberIdToInvoices() {
    for (let businessID of businessIDs) {
        await updateInvoicesInBatches(businessID);
    }
}

// Llamar a la función
// fbAddNumberIdToInvoices(user).catch(console.error);
