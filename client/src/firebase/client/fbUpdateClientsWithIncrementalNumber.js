import { collection, deleteField, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import React from 'react'
import { db } from '../firebaseconfig'

export async function fbUpdateClientsWithIncrementalNumber({ setMessage }) {
    const businessesRef = collection(db, "businesses");
    const businessesSnapshot = await getDocs(businessesRef);
    
    const result = {
        totalBusinesses: 0,
        businesses: []
    };

    for (const businessDoc of businessesSnapshot.docs) {
        const businessId = businessDoc.id;
        const clientsRef = collection(db, "businesses", businessId, "clients");
        const clientsSnapshot = await getDocs(clientsRef);

        // Obtener el último número usado
        let lastNumber = 0;
        const clientCounterLastNumberRef = doc(db, "businesses", businessId, "counters", "lastClientId");
        const clientCounterLastNumberSnap = await getDoc(clientCounterLastNumberRef);

        if (clientCounterLastNumberSnap.exists()) {
            lastNumber = clientCounterLastNumberSnap.data().value || 0;
        }

        // Recorrer y actualizar cada cliente
        for (const clientDoc of clientsSnapshot.docs) {
            lastNumber++;
            const clientRef = clientDoc.ref;
            await updateDoc(clientRef, {
                "numberId": deleteField()
            });
        }

        // // Actualizar el último número usado
        // await setDoc(clientCounterLastNumberRef, { value: lastNumber });

        result.totalBusinesses++;
        result.businesses.push({
            businessId,
            totalClients: clientsSnapshot.docs.length
        });
    }

    // Crear mensajes
    let messages = `Total de negocios: ${result.totalBusinesses}\n`;
    result.businesses.forEach(business => {
        messages += `Negocio ID: ${business.businessId}, Clientes: ${business.totalClients}\n`;
    });

    console.log('Todos los clientes actualizados y el último número guardado.');
    // Establecer el mensaje
    setMessage(messages);

}
