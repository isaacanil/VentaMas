import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc, where, limit } from 'firebase/firestore';
import { db } from '../firebaseconfig';

const COLLECTION_NAME = 'invoiceEditAuthorizations';

const getColRef = (businessID) => collection(db, 'businesses', businessID, COLLECTION_NAME);

const nowTs = () => Timestamp.now();

const calcExpiresAt = (hours = 48) => {
  const ms = Date.now() + hours * 60 * 60 * 1000;
  return Timestamp.fromMillis(ms);
};

export const requestInvoiceEditAuthorization = async (user, invoice, reasons = [], note = '') => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');
  if (!invoice?.id) throw new Error('Falta id de la factura');

  // Evitar duplicados: si ya hay pendiente no vencida para esta factura
  const colRef = getColRef(user.businessID);
  const qy = query(
    colRef,
    where('invoiceId', '==', invoice.id),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(qy);
  if (!snap.empty) {
    const docData = snap.docs[0].data();
    // Considerar expiración
    if (docData.expiresAt?.toMillis() > Date.now()) {
      return { alreadyPending: true, id: snap.docs[0].id };
    }
  }

  const payload = {
    businessID: user.businessID,
    invoiceId: invoice.id,
    invoiceNumber: invoice.numberID || null,
    createdAt: serverTimestamp(),
    expiresAt: calcExpiresAt(48),
    status: 'pending', // pending | approved | rejected | expired | used
    reasons,
    requestNote: note || '',
    requestedBy: {
      uid: user.uid,
      name: user.displayName || user.name || '',
      role: user.role || 'cashier',
    },
    approvedBy: null,
    approvedAt: null,
    usedBy: null,
    usedAt: null,
  };

  const res = await addDoc(colRef, payload);
  return { id: res.id };
};

export const approveInvoiceEditAuthorization = async (user, requestId, approver) => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');
  const ref = doc(db, 'businesses', user.businessID, COLLECTION_NAME, requestId);
  await updateDoc(ref, {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: {
      uid: approver.uid,
      name: approver.displayName || approver.name || '',
      role: approver.role || 'admin',
    },
  });
};

export const rejectInvoiceEditAuthorization = async (user, requestId, approver) => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');
  const ref = doc(db, 'businesses', user.businessID, COLLECTION_NAME, requestId);
  await updateDoc(ref, {
    status: 'rejected',
    approvedAt: serverTimestamp(),
    approvedBy: {
      uid: approver.uid,
      name: approver.displayName || approver.name || '',
      role: approver.role || 'admin',
    },
  });
};

export const expireIfNeeded = async (businessID, requestId) => {
  const ref = doc(db, 'businesses', businessID, COLLECTION_NAME, requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data();
  if (data.status === 'pending' && data.expiresAt?.toMillis() < Date.now()) {
    await updateDoc(ref, { status: 'expired' });
    return true;
  }
  return false;
};

export const markAuthorizationUsed = async (user, requestId, usedBy) => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');
  const ref = doc(db, 'businesses', user.businessID, COLLECTION_NAME, requestId);
  await updateDoc(ref, {
    status: 'used',
    usedAt: serverTimestamp(),
    usedBy: {
      uid: usedBy.uid,
      name: usedBy.displayName || usedBy.name || '',
      role: usedBy.role || 'cashier',
    },
  });
};

export const getActiveApprovedAuthorizationForInvoice = async (user, invoice) => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');
  const colRef = getColRef(user.businessID);

  let qy;
  if (invoice?.id) {
    qy = query(
      colRef,
      where('invoiceId', '==', invoice.id),
      where('status', '==', 'approved'),
      orderBy('approvedAt', 'desc'),
      limit(1)
    );
  } else if (invoice?.numberID) {
    qy = query(
      colRef,
      where('invoiceNumber', '==', invoice.numberID),
      where('status', '==', 'approved'),
      orderBy('approvedAt', 'desc'),
      limit(1)
    );
  } else {
    return null;
  }

  const snap = await getDocs(qy);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  // No expirar aprobadas al consultar uso; la expiración automática solo aplica a 'pending'
  return { id: d.id, ...data };
};

export const listPendingInvoiceEditAuthorizations = async (user) => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');
  const colRef = getColRef(user.businessID);
  const qy = query(colRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(qy);
  const items = [];
  for (const d of snap.docs) {
    const data = d.data();
    if (data.expiresAt?.toMillis && data.expiresAt.toMillis() < Date.now()) {
      try { await updateDoc(d.ref, { status: 'expired' }); } catch {}
      continue;
    }
    items.push({ id: d.id, ...data });
  }
  return items;
};

/**
 * Lista autorizaciones con filtro por estado
 * status: 'pending' | 'completed' | 'approved' | 'rejected' | 'used' | 'expired' | 'all'
 * limitCount: número máximo de resultados (default 200)
 */
export const listInvoiceEditAuthorizations = async (user, { status = 'pending', limitCount = 200 } = {}) => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');
  const colRef = getColRef(user.businessID);

  let qy;
  if (status === 'all') {
    qy = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
  } else if (status === 'completed') {
    // Estados considerados completados
    qy = query(colRef, where('status', 'in', ['approved', 'rejected', 'used', 'expired']), orderBy('createdAt', 'desc'), limit(limitCount));
  } else {
    qy = query(colRef, where('status', '==', status), orderBy('createdAt', 'desc'), limit(limitCount));
  }

  const snap = await getDocs(qy);
  const items = [];
  for (const d of snap.docs) {
    const data = d.data();
    // Expirar automáticamente si está pendiente y ya pasó el tiempo
    if (data.status === 'pending' && data.expiresAt?.toMillis && data.expiresAt.toMillis() < Date.now()) {
      try { await updateDoc(d.ref, { status: 'expired' }); } catch {}
      if (status === 'pending') continue; // en vista pendiente, excluir expiradas
    }
    items.push({ id: d.id, ...data });
  }
  return items;
};
