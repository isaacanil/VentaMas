import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';

import { functions } from '../../../../firebase/firebaseconfig';

/**
 * Encapsula la lógica de finalización de una sesión de inventario.
 * No muestra modales ni mensajes; solo realiza la operación y expone el estado.
 */
export function useFinalizeInventory({ db, user, sessionId, navigate }) {
  const [finalizing, setFinalizing] = useState(false);

  const finalize = async ({ groups, counts, stocks, countsMeta }) => {
    if (!db || !sessionId || !user?.businessID) return null;
    setFinalizing(true);
    try {
      // 1) Marcar la sesión como "processing" mientras el backend trabaja
      const sessionRef = doc(
        db,
        'businesses',
        user.businessID,
        'inventorySessions',
        sessionId,
      );
      await updateDoc(sessionRef, {
        status: 'processing',
        processingAt: serverTimestamp(),
        processingBy: user.uid || user.id,
      });

      // 2) Invocar función en backend para finalizar (aplica ajustes y cierra)
      try {
        const callFinalize = httpsCallable(
          functions,
          'finalizeInventorySession',
        );
        const { data } = await callFinalize({
          user: { uid: user.uid || user.id, businessID: user.businessID },
          sessionId,
          groups,
          counts,
          stocks,
          countsMeta,
        });
        if (navigate) navigate('/inventory/control');
        return data || null;
      } catch (e) {
        // Si falla, revertir estado a 'open'
        try {
          const sessionRef = doc(
            db,
            'businesses',
            user.businessID,
            'inventorySessions',
            sessionId,
          );
          await updateDoc(sessionRef, { status: 'open' });
        } catch (revertError) {
          const revertMessage =
            revertError instanceof Error
              ? revertError.message
              : String(revertError);
          throw new Error(
            `${e instanceof Error ? e.message : String(e)}. No se pudo revertir la sesión: ${revertMessage}`,
          );
        }
        throw e;
      }
    } finally {
      setFinalizing(false);
    }
  };

  return { finalizing, finalize };
}

export default useFinalizeInventory;
