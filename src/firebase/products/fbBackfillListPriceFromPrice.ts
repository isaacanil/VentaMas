// @ts-nocheck
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const hasValidAmount = (amount, { allowZero }) =>
  Number.isFinite(amount) && (allowZero ? amount >= 0 : amount > 0);

/**
 * Copia pricing.price hacia pricing.listPrice cuando listPrice falta o es 0.
 * Útil tras importes donde solo se llenó "price".
 * @param {Object} user - Usuario con businessID.
 * @param {{ allowZeroPrice?: boolean, batchSize?: number, dryRun?: boolean }} options
 * @returns {Promise<{ scanned: number, candidates: number, updated: number, dryRun: boolean }>}
 */
export async function fbBackfillListPriceFromPrice(
  user,
  { allowZeroPrice = false, batchSize = 450, dryRun = false } = {},
) {
  if (!user?.businessID) return { scanned: 0, candidates: 0, updated: 0, dryRun };
  const businessID = String(user.businessID);
  const productsRef = collection(db, 'businesses', businessID, 'products');
  const snapshot = await getDocs(productsRef);
  if (snapshot.empty) return { scanned: 0, candidates: 0, updated: 0, dryRun };

  const candidates = [];
  let scanned = 0;

  snapshot.forEach((docSnap) => {
    scanned += 1;
    const data = docSnap.data() || {};
    const price = toNumber(data?.pricing?.price);
    const listPrice = toNumber(data?.pricing?.listPrice);
    const priceIsValid = hasValidAmount(price, { allowZero: allowZeroPrice });
    const listPriceMissing = !hasValidAmount(listPrice, {
      allowZero: allowZeroPrice,
    });

    if (priceIsValid && listPriceMissing) {
      candidates.push({ id: docSnap.id, price });
    }
  });

  if (dryRun || candidates.length === 0) {
    return {
      scanned,
      candidates: candidates.length,
      updated: 0,
      dryRun,
    };
  }

  let updated = 0;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const slice = candidates.slice(i, i + batchSize);
    const batch = writeBatch(db);
    slice.forEach(({ id, price }) => {
      const ref = doc(productsRef, id);
      batch.update(ref, {
        'pricing.listPrice': price,
        'pricing.price': price,
        'pricing.syncedFromPriceAt': serverTimestamp(),
      });
    });
    await batch.commit();
    updated += slice.length;
  }

  return {
    scanned,
    candidates: candidates.length,
    updated,
    dryRun: false,
  };
}
