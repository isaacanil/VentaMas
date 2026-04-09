import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import type { InventorySession } from '@/utils/inventory/types';
import type { Firestore } from 'firebase/firestore';

interface UseInventorySessionParams {
  db?: Firestore | null;
  businessID?: string | null;
  sessionId?: string | null;
}

interface UseInventorySessionResult {
  session: InventorySession | null;
}

export function useInventorySession({
  db,
  businessID,
  sessionId,
}: UseInventorySessionParams): UseInventorySessionResult {
  const [session, setSession] = useState<InventorySession | null>(null);

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
      if (snap.exists()) {
        const data = snap.data() as InventorySession;
        setSession({ id: snap.id, ...data });
      } else setSession(null);
    });
    return () => unsub();
  }, [db, businessID, sessionId]);

  return { session };
}

export default useInventorySession;
