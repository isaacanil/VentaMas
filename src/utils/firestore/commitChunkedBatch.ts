import { Firestore, writeBatch } from 'firebase/firestore';

export type BatchApplyFn = (b: ReturnType<typeof writeBatch>) => void;

export async function commitChunked(
  db: Firestore,
  applyFns: BatchApplyFn[],
  chunkSize = 450,
) {
  if (!applyFns?.length) return;
  for (let i = 0; i < applyFns.length; i += chunkSize) {
    const batch = writeBatch(db);
    const slice = applyFns.slice(i, i + chunkSize);
    for (const fn of slice) fn(batch);
    await batch.commit();
  }
}
