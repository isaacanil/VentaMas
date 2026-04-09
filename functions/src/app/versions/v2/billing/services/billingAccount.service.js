import { HttpsError } from 'firebase-functions/v2/https';

import { db, FieldValue } from '../../../../core/config/firebase.js';
import { BILLING_DEFAULT_PROVIDER } from '../config/planCatalog.constants.js';
import { asRecord, toCleanString } from '../utils/billingCommon.util.js';

const BILLING_ACCOUNTS_COLLECTION = 'billingAccounts';
const BUSINESS_LINKS_SUBCOLLECTION = 'businessLinks';
const SUBSCRIPTIONS_SUBCOLLECTION = 'subscriptions';
const PAYMENT_HISTORY_SUBCOLLECTION = 'paymentHistory';

const billingAccountsCol = db.collection(BILLING_ACCOUNTS_COLLECTION);

export const resolveBillingAccountIdForOwner = (ownerUid) => {
  const normalizedOwnerUid = toCleanString(ownerUid);
  if (!normalizedOwnerUid) {
    throw new HttpsError('invalid-argument', 'ownerUid es requerido');
  }
  return `acct_${normalizedOwnerUid}`;
};

export const readBusinessOwnerUidFromData = (businessData) => {
  const root = asRecord(businessData);
  const businessNode = asRecord(root.business);
  const nestedBusinessNode = asRecord(businessNode.business);

  return (
    toCleanString(root.ownerUid) ||
    toCleanString(businessNode.ownerUid) ||
    toCleanString(nestedBusinessNode.ownerUid) ||
    toCleanString(root.billingContactUid) ||
    toCleanString(businessNode.billingContactUid) ||
    toCleanString(nestedBusinessNode.billingContactUid) ||
    null
  );
};

export const getBusinessOwnerUid = async (businessId) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const businessSnap = await db.doc(`businesses/${normalizedBusinessId}`).get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const ownerUid = readBusinessOwnerUidFromData(businessSnap.data() || {});
  if (!ownerUid) {
    throw new HttpsError(
      'failed-precondition',
      'El negocio no tiene ownerUid/billingContactUid',
    );
  }

  return ownerUid;
};

export const ensureBillingAccountForOwner = async ({
  ownerUid,
  actorUserId = null,
}) => {
  const normalizedOwnerUid = toCleanString(ownerUid);
  if (!normalizedOwnerUid) {
    throw new HttpsError('invalid-argument', 'ownerUid es requerido');
  }

  const billingAccountId = resolveBillingAccountIdForOwner(normalizedOwnerUid);
  const accountRef = billingAccountsCol.doc(billingAccountId);
  const accountSnap = await accountRef.get();
  if (!accountSnap.exists) {
    await accountRef.set(
      {
        billingAccountId,
        ownerUid: normalizedOwnerUid,
        status: 'active',
        provider: BILLING_DEFAULT_PROVIDER,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: actorUserId || normalizedOwnerUid,
        updatedBy: actorUserId || normalizedOwnerUid,
      },
      { merge: true },
    );
  }

  return { billingAccountId, ownerUid: normalizedOwnerUid };
};

export const linkBusinessToBillingAccount = async ({
  billingAccountId,
  businessId,
  ownerUid,
  actorUserId = null,
}) => {
  const normalizedBillingAccountId = toCleanString(billingAccountId);
  const normalizedBusinessId = toCleanString(businessId);
  const normalizedOwnerUid = toCleanString(ownerUid);
  if (!normalizedBillingAccountId || !normalizedBusinessId || !normalizedOwnerUid) {
    throw new HttpsError(
      'invalid-argument',
      'billingAccountId, businessId y ownerUid son requeridos',
    );
  }

  const accountRef = billingAccountsCol.doc(normalizedBillingAccountId);
  const linkRef = accountRef
    .collection(BUSINESS_LINKS_SUBCOLLECTION)
    .doc(normalizedBusinessId);
  const businessRef = db.doc(`businesses/${normalizedBusinessId}`);

  await Promise.all([
    linkRef.set(
      {
        businessId: normalizedBusinessId,
        ownerUid: normalizedOwnerUid,
        status: 'active',
        linkedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    ),
    accountRef.set(
      {
        ownerUid: normalizedOwnerUid,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUserId || normalizedOwnerUid,
      },
      { merge: true },
    ),
    businessRef.set(
      {
        billingAccountId: normalizedBillingAccountId,
        updatedAt: FieldValue.serverTimestamp(),
        business: {
          billingAccountId: normalizedBillingAccountId,
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    ),
  ]);

  return {
    ok: true,
    billingAccountId: normalizedBillingAccountId,
    businessId: normalizedBusinessId,
  };
};

export const listBillingAccounts = async ({ limit = 100 } = {}) => {
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(Number(limit) || 50)));
  const accountsSnap = await billingAccountsCol.limit(safeLimit).get();

  const result = [];
  for (const accountDoc of accountsSnap.docs) {
    const data = accountDoc.data() || {};
    const linksSnap = await accountDoc.ref.collection(BUSINESS_LINKS_SUBCOLLECTION).get();
    const subscriptionsSnap = await accountDoc.ref
      .collection(SUBSCRIPTIONS_SUBCOLLECTION)
      .orderBy('updatedAt', 'desc')
      .limit(5)
      .get();

    result.push({
      billingAccountId: accountDoc.id,
      ownerUid: toCleanString(data.ownerUid),
      status: toCleanString(data.status) || 'active',
      provider: toCleanString(data.provider) || BILLING_DEFAULT_PROVIDER,
      businessCount: linksSnap.size,
      businesses: linksSnap.docs.map((docSnap) => docSnap.id),
      subscriptions: subscriptionsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })),
      updatedAt: data.updatedAt || null,
    });
  }

  return result;
};

export const getBillingOverviewByBusiness = async ({
  businessId,
  paymentHistoryLimit = 20,
}) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const businessRef = db.doc(`businesses/${normalizedBusinessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const businessData = businessSnap.data() || {};
  const ownerUid = readBusinessOwnerUidFromData(businessData);
  if (!ownerUid) {
    throw new HttpsError(
      'failed-precondition',
      'No se pudo resolver owner del negocio',
    );
  }

  const billingAccountId =
    toCleanString(businessData.billingAccountId) ||
    resolveBillingAccountIdForOwner(ownerUid);

  const accountRef = billingAccountsCol.doc(billingAccountId);
  const accountSnap = await accountRef.get();
  const accountData = accountSnap.exists ? accountSnap.data() || {} : {};

  const subscriptionsSnap = await accountRef
    .collection(SUBSCRIPTIONS_SUBCOLLECTION)
    .orderBy('updatedAt', 'desc')
    .limit(10)
    .get();
  const historySnap = await accountRef
    .collection(PAYMENT_HISTORY_SUBCOLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(Math.max(1, Math.min(100, paymentHistoryLimit)))
    .get();
  const usageCurrentSnap = await businessRef.collection('usage').doc('current').get();
  const usageMonthSnap = await businessRef
    .collection('usage')
    .doc('monthly')
    .collection('entries')
    .orderBy('month', 'desc')
    .limit(6)
    .get();

  return {
    businessId: normalizedBusinessId,
    ownerUid,
    billingAccountId,
    account: {
      billingAccountId,
      ownerUid: toCleanString(accountData.ownerUid) || ownerUid,
      status: toCleanString(accountData.status) || 'active',
      provider: toCleanString(accountData.provider) || BILLING_DEFAULT_PROVIDER,
      updatedAt: accountData.updatedAt || null,
    },
    subscriptions: subscriptionsSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })),
    paymentHistory: historySnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })),
    usage: {
      current: usageCurrentSnap.exists ? usageCurrentSnap.data() || {} : {},
      monthly: usageMonthSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })),
    },
    businessSubscription: asRecord(businessData.subscription),
  };
};
