import { Firestore, writeBatch } from 'firebase/firestore';

type FirestoreBatch = ReturnType<typeof writeBatch>;
export type BatchApplyFn<TBatch extends FirestoreBatch = FirestoreBatch> = (
  batch: TBatch,
) => void;

export async function commitChunked<TBatch extends FirestoreBatch = FirestoreBatch>(
  db: Firestore,
  applyFns: Array<BatchApplyFn<TBatch>>,
  chunkSize = 450,
): Promise<void> {
  if (!applyFns?.length) return;
  for (let i = 0; i < applyFns.length; i += chunkSize) {
    const batch = writeBatch(db) as TBatch;
    const slice = applyFns.slice(i, i + chunkSize);
    for (const fn of slice) fn(batch);
    await batch.commit();
  }
}
