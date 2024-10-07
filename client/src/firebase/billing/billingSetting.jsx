// src/utils/updateBillingModeInFirebase.js
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import * as antd from 'antd';
import { db } from '../firebaseconfig';
const { message } = antd;

// Función para actualizar el modo de facturación en Firebase
export const setBillingSettings = async (user, setting) => {
    if (!user?.businessID) {
        message.error('El ID del negocio no está disponible.');
        return;
    }
    try {
        // Referencia al documento del usuario
        const userDocRef = doc(db, 'businesses', user.businessID, "settings", "billing");

        const docSnapshot = await getDoc(userDocRef);

        // Actualizar el campo billingMode en el documento del usuario
        if (docSnapshot.exists()) {
            // Si el documento existe, actualizar el campo billingMode
            await updateDoc(userDocRef, setting);
        } else {
            // Si el documento no existe, crearlo con los valores proporcionados
            await setDoc(userDocRef, setting);
        }

        console.log('Modo de facturación seleccionado:', setting);
        message.success('El modo de facturación ha sido actualizado correctamente.');

    } catch (error) {
        console.error('Error al actualizar la configuración de facturación:', error);
        message.error('Error al actualizar la configuración de facturación.');
    }
};


export const fbBillingSettings = {
    setBillingSettings
}