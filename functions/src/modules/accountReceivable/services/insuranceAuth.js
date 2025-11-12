// services/insuranceAdmin.service.js
import { https, logger } from 'firebase-functions';
import { nanoid } from 'nanoid';

import { db, Timestamp, serverTimestamp } from '../../../core/config/firebase.js';

const INSURANCE_AUTHS_COLLECTION = 'insuranceAuths';

const toFirestoreTimestamp = (value) => {
    if (!value) return null;
    // Timestamp viene de 'firebase-admin/firestore'
    if (value instanceof Timestamp) return value;
    if (value instanceof Date) return Timestamp.fromDate(value);
    if (typeof value === 'string') {
        try {
            // Intenta parsear, sé cuidadoso con formatos inválidos
            const date = new Date(value);
            if (!isNaN(date.getTime())) { // Verifica si la fecha es válida
                return Timestamp.fromDate(date);
            }
        } catch (e) {
            console.error("Error parsing date string:", value, e);
            return null; // O maneja el error como prefieras
        }
    }
    // Si usas una librería como Day.js que expone .toDate() o similar:
    if (value && typeof value.toDate === 'function') {
        return Timestamp.fromDate(value.toDate());
    }
    // El chequeo `$d` era muy específico, es mejor estandarizar antes o usar .toDate()
    console.warn("Could not convert value to Firestore Timestamp:", value);
    return null;
};


export async function addInsuranceAuth(tx, {user, authData, clientId}) {

    if (!user?.businessID || !user?.uid) {
        throw new https.HttpsError('invalid-argument', 'Usuario no válido o sin businessID');
      }
      if (!authData?.insuranceId || !authData?.authNumber) {
        throw new https.HttpsError('invalid-argument', 'Datos de autorización incompletos');
      }
      if (!clientId) {
        throw new https.HttpsError('invalid-argument', 'clientId es requerido');
      }
    
    // 1) Formatear fechas
    const formatted = {
        ...authData,
        birthDate: toFirestoreTimestamp(authData.birthDate),
        indicationDate: toFirestoreTimestamp(authData.indicationDate),
    };

    // 2) Validar duplicados globales
    const dupQuery = db.collection(INSURANCE_AUTHS_COLLECTION)
        .where('insuranceId', '==', authData.insuranceId)
        .where('authNumber', '==', authData.authNumber)
        .where('deleted', '==', false);

    const dupSnap = await tx.get(dupQuery);
    if (!dupSnap.empty) {
        throw new Error('Ya existe una autorización con ese número para esta aseguradora');
    }

    // 3) Crear documento con ID propio
    const id = nanoid();
    const ref = db.doc(`${INSURANCE_AUTHS_COLLECTION}/${id}`);
    await tx.set(ref,{
        id,
        businessId: user.businessID,
        userId: user.uid,
        clientId,
        ...formatted,
        status: 'active',
        deleted: false,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
    });
logger.info(`Autorización de seguro creada con ID: ${id}`, { userId: user.uid, businessId: user.businessID });
    return id;
};

export const updateInsuranceAuth = async (user, authId, updates) => {
    const ref = db.doc(`${INSURANCE_AUTHS_COLLECTION}/${authId}`);
    const toMerge = { ...updates };

    if (Object.prototype.hasOwnProperty.call(toMerge, 'birthDate')) {
        toMerge.birthDate = toFirestoreTimestamp(toMerge.birthDate);
    }
    if (Object.prototype.hasOwnProperty.call(toMerge, 'indicationDate')) {
        toMerge.indicationDate = toFirestoreTimestamp(toMerge.indicationDate);
    }

    await ref.update({
        ...toMerge,
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
    });
};

export const softDeleteInsuranceAuth = async (user, authId) => {
    const ref = db.doc(`${INSURANCE_AUTHS_COLLECTION}/${authId}`);
    const authSnap = await ref.get();
    if (!authSnap.exists) {
        throw new Error('No existe la autorización para eliminar');
    }
    await ref.set({
        deleted: true,
        deletedBy: user.uid,
        deletedAt: serverTimestamp(),
    });
};

export const getInsuranceAuthByClient = async (user, clientId) => {
    const q = db.collection(INSURANCE_AUTHS_COLLECTION)
        .where('businessId', '==', user.businessID)
        .where('clientId', '==', clientId)
        .where('deleted', '==', false);

    const snap = await q.get();
    if (snap.empty) return null;
    return snap.docs[0].data();
};

export const searchInsuranceAuthGlobally = async (insuranceId, authNumber) => {
    const q = db.collection(INSURANCE_AUTHS_COLLECTION)
        .where('insuranceId', '==', insuranceId)
        .where('authNumber', '==', authNumber)
        .where('deleted', '==', false);
    const snap = await q.get();
    if (snap.empty) return [];
    return snap.docs.map(d => d.data());
};
