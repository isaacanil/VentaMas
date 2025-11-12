import { db, FieldValue } from '../../../../../core/config/firebase.js'
import { getNextID } from '../../../../../core/utils/getNextID.js'

/**
 * Devuelve el almacén por defecto del negocio, o el primero activo si no hay uno marcado.
 * No crea nuevos almacenes.
 * @param {{ businessID: string }} user
 * @returns {Promise<{ id: string }|null>}
 */
export async function getDefaultWarehouse(user) {
  if (!user?.businessID) return null
  const col = db.collection('businesses').doc(user.businessID).collection('warehouses')

  // 1) Preferir marcado como defaultWarehouse (ignorando isDeleted si falta)
  const qDefault = await col.where('defaultWarehouse', '==', true).limit(10).get()
  if (!qDefault.empty) {
    const doc = qDefault.docs.find(d => (d.data()?.isDeleted !== true)) || qDefault.docs[0]
    if (doc) {
      const data = doc.data() || {}
      // Normaliza en el momento: si no tiene isDeleted, ponerlo en false
      if (data.isDeleted === undefined) {
        try {
          await doc.ref.update({
            isDeleted: false,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: user.uid || null,
          })
        } catch {
          /* noop - normalizing flag failure */
        }
        return { id: doc.id, ...data, isDeleted: false }
      }
      return { id: doc.id, ...data }
    }
  }

  // 2) Intentar con isDeleted == false directamente
  const qActive = await col.where('isDeleted', '==', false).limit(10).get()
  if (!qActive.empty) {
    const d = qActive.docs[0]
    const data = d.data() || {}
    // Por si faltara (no debería), normaliza a false
    if (data.isDeleted === undefined) {
      try {
        await d.ref.update({
          isDeleted: false,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: user.uid || null,
        })
      } catch {
        /* noop - normalizing flag failure */
      }
      return { id: d.id, ...data, isDeleted: false }
    }
    return { id: d.id, ...data }
  }

  // 3) Último intento: tomar cualquiera no eliminado (o primero si todos carecen del flag)
  const any = await col.limit(20).get()
  if (!any.empty) {
    const doc = any.docs.find(d => (d.data()?.isDeleted !== true)) || any.docs[0]
    if (doc) {
      const data = doc.data() || {}
      if (data.isDeleted === undefined) {
        try {
          await doc.ref.update({
            isDeleted: false,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: user.uid || null,
          })
        } catch {
          /* noop - normalizing flag failure */
        }
        return { id: doc.id, ...data, isDeleted: false }
      }
      return { id: doc.id, ...data }
    }
  }

  return null
}

/**
 * Obtiene el almacén por defecto o crea uno básico si no existe ninguno.
 * @param {{ businessID: string, uid?: string }} user
 * @returns {Promise<{ id: string }|null>}
 */
export async function ensureDefaultWarehouse(user) {
  if (!user?.businessID) return null
  // 1) si hay default explícito
  const existing = await getDefaultWarehouse(user)
  if (existing) return existing

  // 2) si no hay ninguno, crear uno virtual por defecto
  const col = db.collection('businesses').doc(user.businessID).collection('warehouses')
  const now = FieldValue.serverTimestamp()
  const ref = col.doc()
  const number = await getNextID(user, 'lastWarehouseId')
  const data = {
    id: ref.id,
    name: 'Almacén Virtual',
    description: 'Almacén por defecto (autocreado)',
    shortName: 'Virtual',
    number,
    owner: user.uid || null,
    location: 'default',
    address: 'default address',
    dimension: { length: 0, width: 0, height: 0 },
    capacity: 0,
    defaultWarehouse: true,
    isDeleted: false,
    createdAt: now,
    createdBy: user.uid || null,
    updatedAt: now,
    updatedBy: user.uid || null,
  }
  await ref.set(data)
  return { id: ref.id, ...data }
}
