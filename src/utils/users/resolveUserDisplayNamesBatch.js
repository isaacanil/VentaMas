// Utilidad para resolver nombres legibles de usuarios en lote desde /users
// Limita cada query a grupos de 10 IDs (límite actual de Firestore para 'in')
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
} from 'firebase/firestore';

const firstNonEmpty = (...vals) =>
  vals.find((v) => typeof v === 'string' && v.trim())?.trim();

function chunk(arr, size = 10) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Carga nombres legibles para una lista de UIDs desde /users.
 * - Respeta caché previa (prevCache) para no re-consultar.
 * - No muta prevCache; devuelve solo los nuevos pares { uid: resolvedName }.
 * - En caso de error por lote, hace fallback de cada uid a su propio valor.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string[]} uids
 * @param {Record<string,string>} prevCache
 * @returns {Promise<Record<string,string>>}
 */
export async function resolveUserDisplayNamesBatch(db, uids, prevCache = {}) {
  const unique = Array.from(new Set((uids || []).filter(Boolean)));
  const missing = unique.filter((uid) => !prevCache[uid]);

  if (missing.length === 0) return {}; // nada nuevo que cargar

  const results = {};
  for (const group of chunk(missing, 10)) {
    try {
      const q = query(
        collection(db, 'users'),
        where(documentId(), 'in', group),
      );
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const nested = data.user || {};
        const name =
          firstNonEmpty(
            data.realName,
            nested.realName,
            data.name,
            nested.name,
            data.displayName,
            nested.displayName,
            data.fullName,
            nested.fullName,
            data.email,
            nested.email,
          ) || docSnap.id;
        results[docSnap.id] = name;
      });
      // fallback para ids no encontrados en este lote
      for (const uid of group) {
        if (!results[uid]) results[uid] = uid;
      }
    } catch {
      // fallback de todo el grupo si falla la consulta
      for (const uid of group) {
        if (!results[uid]) results[uid] = uid;
      }
    }
  }
  return results;
}

/**
 * Recolecta UIDs relevantes para la tabla / vista actual.
 * Extiende fácilmente con más campos de sesión si se requieren.
 */
export function collectUIDsForInventoryTable({ countsMeta, session }) {
  const s = new Set();
  Object.values(countsMeta || {}).forEach((meta) => {
    if (meta?.updatedBy) s.add(String(meta.updatedBy));
  });
  if (session?.user?.uid) s.add(String(session.user.uid));
  if (session?.closedBy) s.add(String(session.closedBy));
  if (session?.createdBy) s.add(String(session.createdBy));
  return Array.from(s);
}
