import { onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const useFirestoreRealtime = (collectionRef, filters = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(() => !!collectionRef);

  // Derive safe values: if no collectionRef, data is [] and loading is false
  const safeData = collectionRef ? data : [];
  const safeLoading = collectionRef ? loading : false;

  useEffect(() => {
    if (!collectionRef) {
      return;
    }
    let qRef = collectionRef;
    filters.forEach(([field, op, value]) => {
      qRef = query(qRef, where(field, op, value));
    });
    const unsubscribe = onSnapshot(qRef, (snapshot) => {
      setData(snapshot.docs.map((doc) => doc.data()));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [collectionRef, filters]);

  return { data: safeData, loading: safeLoading };
};
