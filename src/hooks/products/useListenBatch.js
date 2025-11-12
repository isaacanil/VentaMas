import { useState, useEffect } from 'react';

import { listenAllBatches } from '../../firebase/warehouse/batchService';

export const useListenBatches = (user, productID = null) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productID) {
      setBatches([]);
      setLoading(false);
      return;
    }
    if (!user) {
      setBatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
