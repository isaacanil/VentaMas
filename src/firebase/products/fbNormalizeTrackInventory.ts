import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';

/**
 * Normaliza el campo trackInventory en todos los productos del negocio.
 * Si el campo no existe o es null, se establece en true (por defecto),
 * a menos que el itemType sea 'service', en cuyo caso se establece en false.
 */
export const normalizeProductTrackInventory = async (
  user,
  { dryRun = false } = {},
) => {
  if (!user?.businessID) {
    throw new Error('No se encontró un negocio válido para el usuario.');
  }

  const productsRef = collection(
    db,
    'businesses',
    String(user.businessID),
    'products',
  );
  const snapshot = await getDocs(productsRef);

  if (snapshot.empty) {
    return {
      total: 0,
      updated: 0,
      skipped: 0,
      dryRun,
    };
  }

  let batch = writeBatch(db);
  let operations = 0;

  const summary = {
    total: snapshot.size,
    updated: 0,
    skipped: 0,
    dryRun,
  };

  const commitBatch = async () => {
    if (operations === 0 || dryRun) return;
    await batch.commit();
    batch = writeBatch(db);
    operations = 0;
  };

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() || {};
    const currentTrack = data.trackInventory;
    const itemType = data.itemType;

    // Solo actualizamos si no es un booleano (es null, undefined o string)
    if (typeof currentTrack === 'boolean') {
      summary.skipped += 1;
      continue;
    }

    let targetTrack = true;
    if (itemType === 'service') {
      targetTrack = false;
    }

    summary.updated += 1;

    if (dryRun) continue;

    const productRef = doc(
      db,
      'businesses',
      String(user.businessID),
      'products',
      docSnap.id,
    );

    batch.update(productRef, { trackInventory: targetTrack });
    operations += 1;

    if (operations >= 400) {
      await commitBatch();
    }
  }

  await commitBatch();
  return summary;
};
