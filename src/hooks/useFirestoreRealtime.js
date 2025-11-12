
import { onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const useFirestoreRealtime = (collectionRef, filters = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectionRef) {
      setData([]);
      setLoading(false);
      return;
    }
    let qRef = collectionRef;
    filters.forEach(([field, op, value]) => {
      qRef = query(qRef, where(field, op, value));
    });
    const unsubscribe = onSnapshot(qRef, snapshot => {
      setData(snapshot.docs.map(doc => doc.data()));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [collectionRef, filters]);

  return { data, loading };
};