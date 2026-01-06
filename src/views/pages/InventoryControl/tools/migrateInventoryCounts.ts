// Migration utility to normalize inventory session counts documents
// - Copies legacy Spanish fields (conteoReal, stockSistema, diferencia)
//   into English fields (realCount, systemStock, difference)
// - Deletes legacy fields after migration
// - Safe to run multiple times (idempotent)

import {
  collection,
  getDocs,
  writeBatch,
  doc,
  deleteField,
} from 'firebase/firestore';

/**
 * migrateAllBusinessesInventoryCounts
 * @param {import('firebase/firestore').Firestore} db
 * @param {{ businessIds?: string[], dryRun?: boolean, onProgress?: (info: any) => void }} options
 * @returns {Promise<{ businesses: number, sessions: number, docsScanned: number, docsUpdated: number, fieldsMigrated: number, errors: number, logs: string[] }>}
 */
export async function migrateAllBusinessesInventoryCounts(
  db,
  options: {
    businessIds?: string[] | null;
    dryRun?: boolean;
    onProgress?: (info: { type: string; msg: string }) => void;
  } = {},
) {
  const { businessIds = null, dryRun = false, onProgress } = options;
  const summary = {
    businesses: 0,
    sessions: 0,
    docsScanned: 0,
    docsUpdated: 0,
    fieldsMigrated: 0,
    errors: 0,
    logs: [],
  };

  const log = (msg) => {
    summary.logs.push(msg);
    if (onProgress) onProgress({ type: 'log', msg });
  };

  let bizIds = businessIds;
  try {
    if (!Array.isArray(bizIds) || bizIds.length === 0) {
      const bizSnap = await getDocs(collection(db, 'businesses'));
      bizIds = bizSnap.docs.map((d) => d.id);
    }
  } catch (e) {
    summary.errors++;
    log(`[error] Listing businesses failed: ${e?.message || e}`);
    throw e;
  }

  for (const bid of bizIds) {
    summary.businesses++;
    log(`[business] ${bid}`);
    try {
      const sessionsSnap = await getDocs(
        collection(db, 'businesses', bid, 'inventorySessions'),
      );
      const sessionIds = sessionsSnap.docs.map((d) => d.id);
      for (const sid of sessionIds) {
        summary.sessions++;
        log(`  [session] ${sid}`);
        const countsSnap = await getDocs(
          collection(db, 'businesses', bid, 'inventorySessions', sid, 'counts'),
        );

        let batch = writeBatch(db);
        let pending = 0;

        for (const docSnap of countsSnap.docs) {
          summary.docsScanned++;
          const id = docSnap.id;
          const data = (docSnap.data() || {}) as Record<string, unknown>;

          const hasLegacy =
            Object.prototype.hasOwnProperty.call(data, 'conteoReal') ||
            Object.prototype.hasOwnProperty.call(data, 'stockSistema') ||
            Object.prototype.hasOwnProperty.call(data, 'diferencia');
          const needsEnglish =
            data.realCount === undefined ||
            data.systemStock === undefined ||
            data.difference === undefined;

          if (!hasLegacy && !needsEnglish) continue;

          // Resolve target values prioritizing English, falling back to legacy
          const systemStock =
            data.systemStock !== undefined
              ? Number(data.systemStock)
              : data.stockSistema !== undefined
                ? Number(data.stockSistema)
                : undefined;
          const realCount =
            data.realCount !== undefined
              ? Number(data.realCount)
              : data.conteoReal !== undefined
                ? Number(data.conteoReal)
                : undefined;
          let difference =
            data.difference !== undefined
              ? Number(data.difference)
              : data.diferencia !== undefined
                ? Number(data.diferencia)
                : undefined;

          // If not present, compute difference when possible
          if (
            (difference === undefined || Number.isNaN(difference)) &&
            realCount !== undefined &&
            systemStock !== undefined
          ) {
            difference = Number(realCount) - Number(systemStock);
          }

          const ref = doc(
            db,
            'businesses',
            bid,
            'inventorySessions',
            sid,
            'counts',
            id,
          );

          if (!dryRun) {
            const update: Record<string, unknown> = {};
            if (systemStock !== undefined && !Number.isNaN(systemStock))
              update.systemStock = Number(systemStock);
            if (realCount !== undefined && !Number.isNaN(realCount))
              update.realCount = Number(realCount);
            if (difference !== undefined && !Number.isNaN(difference))
              update.difference = Number(difference);
            // Delete legacy keys
            update.stockSistema = deleteField();
            update.conteoReal = deleteField();
            update.diferencia = deleteField();

            batch.set(ref, update, { merge: true });
            pending++;
            summary.docsUpdated++;
            let migrated = 0;
            if (Object.prototype.hasOwnProperty.call(data, 'stockSistema'))
              migrated++;
            if (Object.prototype.hasOwnProperty.call(data, 'conteoReal'))
              migrated++;
            if (Object.prototype.hasOwnProperty.call(data, 'diferencia'))
              migrated++;
            summary.fieldsMigrated += migrated;
          }

          if (pending >= 400) {
            try {
              await batch.commit();
            } catch (e) {
              summary.errors++;
              log(`    [error] commit: ${e?.message || e}`);
            }
            batch = writeBatch(db);
            pending = 0;
          }
        }

        if (!dryRun && pending > 0) {
          try {
            await batch.commit();
          } catch (e) {
            summary.errors++;
            log(`    [error] commit: ${e?.message || e}`);
          }
        }
      }
    } catch (e) {
      summary.errors++;
      log(`  [error] Business ${bid}: ${e?.message || e}`);
    }
  }

  log(
    `[done] businesses=${summary.businesses} sessions=${summary.sessions} docsScanned=${summary.docsScanned} updated=${summary.docsUpdated} fieldsMigrated=${summary.fieldsMigrated} errors=${summary.errors}`,
  );
  return summary;
}

export default migrateAllBusinessesInventoryCounts;


