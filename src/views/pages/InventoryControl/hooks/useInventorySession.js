import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useInventorySession({ db, businessID, sessionId }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!db || !businessID || !sessionId) return;
    
    const sessionRef = doc(
      db,
      'businesses',
      businessID,
      'inventorySessions',
      sessionId,
    );
    const unsub = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) setSession({ id: snap.id, ...snap.data() });
      else setSession(null);
    });
    return () => unsub();
  }, [db, businessID, sessionId]);

  return { session };
}

export default useInventorySession;
