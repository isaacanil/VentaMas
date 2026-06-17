import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';

import { db as defaultDb } from '@/firebase/firebaseconfig';
import { createFirebaseCallable } from '@/firebase/functions/callable';

import type {
  CountsMap,
  CountsMetaMap,
  InventoryGroup,
  InventoryStockItem,
  InventoryUser,
} from '@/utils/inventory/types';
import type { Firestore } from 'firebase/firestore';
import type { NavigateFunction } from 'react-router-dom';

interface FinalizeInventoryParams {
  db?: Firestore | null;
  user?: InventoryUser | null;
  sessionId?: string | null;
  navigate?: NavigateFunction;
}

interface FinalizePayload {
  groups: InventoryGroup[];
  counts: CountsMap;
  stocks: InventoryStockItem[];
  countsMeta: CountsMetaMap;
}

type FinalizeInventoryCallablePayload = FinalizePayload & {
  sessionId: string;
  user: {
    businessID: string;
    uid: string | undefined;
  };
};

interface UseFinalizeInventoryResult {
  finalizing: boolean;
  finalize: (payload: FinalizePayload) => Promise<unknown | null>;
}

const finalizeInventorySessionCallable = createFirebaseCallable<
  FinalizeInventoryCallablePayload,
  unknown
>('finalizeInventorySession');

/**
 * Encapsula la lógica de finalización de una sesión de inventario.
 * No muestra modales ni mensajes; solo realiza la operación y expone el estado.
 */
export function useFinalizeInventory({
  db = defaultDb,
  user,
  sessionId,
  navigate,
}: FinalizeInventoryParams): UseFinalizeInventoryResult {
  const [finalizing, setFinalizing] = useState(false);

  const finalize = async ({
    groups,
    counts,
    stocks,
    countsMeta,
  }: FinalizePayload) => {
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
        const data = await finalizeInventorySessionCallable({
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
