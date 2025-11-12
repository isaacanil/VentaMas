// functions/src/modules/client/services/clientAdmin.service.js
import { https, logger } from "firebase-functions";

import { serverTimestamp, db } from "../../../core/config/firebase.js";
import {
    buildClientWritePayload,
    CLIENT_ROOT_FIELDS,
    extractNormalizedClient,
} from "../utils/clientNormalizer.js";

/**
 * Cliente genérico a usar cuando no se especifica un cliente
 */
export const GenericClient = { id: "GC-0000", name: "Cliente Genérico" };

/**
 * Recupera o actualiza los datos de un cliente
 * @param {Object} user - Datos del usuario
 * @param {Object} client - Datos del cliente a actualizar
 * @returns {Promise<Object>} Datos del cliente actualizados
 */
export async function retrieveAndUpdateClient(tx, { user, client, clientSnap = null }) {
    if (!user?.businessID || !user?.uid) {
        throw new https.HttpsError(
            'invalid-argument',
            'Usuario no válido o sin businessID'
        );
    }
    if (!client || !client.id) {
        return GenericClient;
    }

    const businessId = user.businessID;
    const clientId = client.id;
    const clientRef = db.doc(`businesses/${businessId}/clients/${clientId}`);

    const exists = clientSnap?.exists ?? false;
    const snapshotData = exists ? clientSnap.data() || {} : {};
    const existingData = exists ? extractNormalizedClient(snapshotData) : {};

    const mergedClient = {
        ...existingData,
        ...client,
        updatedAt: serverTimestamp(),
    };

    if (!exists) {
        mergedClient.createdAt = serverTimestamp();
    }

    const { payload, client: normalizedClient } = buildClientWritePayload(mergedClient);

    const extras = {};
    for (const [key, value] of Object.entries(snapshotData)) {
        if (key === 'client') continue;
        if (!CLIENT_ROOT_FIELDS.has(key)) {
            extras[key] = value;
        }
    }

    tx.set(clientRef, { ...payload, ...extras }, { merge: true });
    logger.info(`Client ${exists ? 'updated' : 'created'} (tx): ${clientId}`);

    return normalizedClient;

}
