//crea una funcion para obtener todos los usuarios de firebase que rebiba user y user compruebas user.businessID y devuelve la lista de clientes

import { collection, getDocs } from "firebase/firestore";

import { db } from "../firebaseconfig";

export async function getClients(user) {
    if (!user.businessID) return [];
    try {
        const clientsRef = collection(db, 'businesses', user.businessID, 'clients');
        
        const clients = await getDocs(clientsRef);

        if (clients.empty) return [];

        const clientsList = clients.docs.map(doc => doc.data().client);
        return clientsList;
    } catch (error) {
        console.error('Error loading insurance data:', error);
    }

}