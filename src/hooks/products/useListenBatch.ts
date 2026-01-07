// @ts-nocheck
import { useEffect, useState } from 'react';

import { listenAllBatches } from '../../firebase/warehouse/batchService';
import type { Batch } from '@/models/Warehouse/Batch';
import type { InventoryUser } from '@/utils/inventory/types';

type BatchRecord = Partial<Batch> & { id?: string };

export const useListenBatches = (
  user: InventoryUser | null | undefined,
  productID: string | null = null,
) => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(() => Boolean(productID && user));
  const [error] = useState<unknown | null>(null);

  useEffect(() => {
    if (!productID || !user) {
      return;
    }

    // Iniciar la escucha en tiempo real
    const unsubscribe = listenAllBatches(user, productID, (updatedBatches) => {
      setBatches(updatedBatches);
      setLoading(false);
    });

    // Limpiar la suscripción al desmontar el componente
    return () => unsubscribe();
  }, [user, productID]);

  return { batches, loading, error };
};

export default useListenBatches;