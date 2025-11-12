import {
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../../firebaseconfig';
import { toTimestamp } from '../../../utils/firebase/toTimestamp';

const TIMESTAMP_PATHS = [
  ['dates', 'createdAt'],
  ['dates', 'expenseDate'],
  ['dates', 'updatedAt'],
  ['createdAt'],
  ['updatedAt'],
  ['expenseDate'],
];

const MAX_SAMPLE_DETAILS = 20;
const DEFAULT_BATCH_SIZE = 400;

const getNestedValue = (target, path) => (
  path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), target)
);

const ensureNestedObject = (target, path) => (
  path.reduce((acc, key) => {
    if (!acc[key] || typeof acc[key] !== 'object') {
      acc[key] = {};
    }
    return acc[key];
  }, target)
);

const setNestedValue = (target, path, value) => {
  const lastKey = path[path.length - 1];

  if (path.length === 1) {
    target[lastKey] = value;
    return;
  }

  const parent = ensureNestedObject(target, path.slice(0, -1));
  parent[lastKey] = value;
};

const pathToString = (path) => path.join('.');

const convertCandidate = (value) => {
  if (value == null) return null;
  if (typeof value?.toMillis === 'function') return null; // Already Timestamp-like

  try {
    return toTimestamp(value);
  } catch {
    return null;
  }
};

const applyConversions = (target) => {
  let fieldsChanged = 0;
  const changedFields = [];

  for (const path of TIMESTAMP_PATHS) {
    const currentValue = getNestedValue(target, path);
    if (currentValue === undefined) continue;

    const converted = convertCandidate(currentValue);
    if (!converted) continue;

    setNestedValue(target, path, converted);
    changedFields.push(pathToString(path));
    fieldsChanged += 1;
  }

  return { fieldsChanged, changedFields };
};

const commitInBatches = async (payloads, batchSize) => {
  if (!payloads.length) return;

  let batch = writeBatch(db);
  let ops = 0;

  const commitBatch = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  };

  for (const { ref, expense } of payloads) {
    batch.update(ref, { expense });
    ops += 1;
    if (ops >= batchSize) {
      await commitBatch();
    }
  }

  await commitBatch();
};

const fixExpenseTimestampsForBusiness = async ({
  businessID,
  dryRun,
  batchSize,
}) => {
  const expensesRef = collection(db, 'businesses', businessID, 'expenses');
  const snapshot = await getDocs(expensesRef);

  if (snapshot.empty) {
    return {
      scanned: 0,
      affected: 0,
      updated: 0,
      fieldsConverted: 0,
      dryRun,
      sample: [],
    };
  }

  const payloads = [];
  const sampleDetails = [];
  let documentsWithIssues = 0;
  let totalFieldsConverted = 0;

  for (const docSnap of snapshot.docs) {
    const expense = docSnap.data()?.expense;
    if (!expense) continue;

    const expensePayload = {
      ...expense,
      dates: {
        ...(expense.dates ?? {}),
      },
    };

    const { fieldsChanged, changedFields } = applyConversions(expensePayload);

    if (fieldsChanged > 0) {
      documentsWithIssues += 1;
      totalFieldsConverted += fieldsChanged;
      payloads.push({ ref: docSnap.ref, expense: expensePayload });

      if (sampleDetails.length < MAX_SAMPLE_DETAILS) {
        sampleDetails.push({
          id: docSnap.id,
          fields: changedFields,
        });
      }
    }
  }

  if (!dryRun) {
    await commitInBatches(payloads, batchSize);
  }

  return {
    scanned: snapshot.size,
    affected: documentsWithIssues,
    updated: dryRun ? 0 : documentsWithIssues,
    fieldsConverted: totalFieldsConverted,
    dryRun,
    sample: sampleDetails,
  };
};

const processBusinessList = async ({
  businessIDs,
  dryRun,
  batchSize,
  onProgress,
}) => {
  const summaries = [];
  const totals = {
    scanned: 0,
    affected: 0,
    updated: 0,
    fieldsConverted: 0,
  };

  let processed = 0;

  for (const businessID of businessIDs) {
    try {
      const summary = await fixExpenseTimestampsForBusiness({
        businessID,
        dryRun,
        batchSize,
      });

      totals.scanned += summary.scanned;
      totals.affected += summary.affected;
      totals.updated += summary.updated;
      totals.fieldsConverted += summary.fieldsConverted;

      summaries.push({
        businessID,
        success: true,
        summary,
      });
    } catch (error) {
      summaries.push({
        businessID,
        success: false,
        error: error?.message || String(error),
      });
    }

    processed += 1;
    if (typeof onProgress === 'function') {
      onProgress({
        processed,
        total: businessIDs.length,
        businessID,
      });
    }
  }

  return {
    totalBusinesses: businessIDs.length,
    processed,
    totals,
    summaries,
    dryRun,
  };
};

export const fbFixExpenseTimestamps = async ({
  businessID,
  dryRun = false,
  batchSize = DEFAULT_BATCH_SIZE,
} = {}) => {
  if (!businessID) {
    throw new Error('El businessID es requerido para normalizar los gastos.');
  }

  return fixExpenseTimestampsForBusiness({ businessID, dryRun, batchSize });
};

export const fbFixExpenseTimestampsForBusinesses = async ({
  businessIDs = [],
  dryRun = false,
  batchSize = DEFAULT_BATCH_SIZE,
  onProgress,
} = {}) => {
  if (!Array.isArray(businessIDs) || businessIDs.length === 0) {
    throw new Error('Debes proporcionar al menos un businessID.');
  }

  return processBusinessList({ businessIDs, dryRun, batchSize, onProgress });
};

export const fbFixExpenseTimestampsForAll = async ({
  dryRun = false,
  batchSize = DEFAULT_BATCH_SIZE,
  onProgress,
} = {}) => {
  const businessesRef = collection(db, 'businesses');
  const snapshot = await getDocs(businessesRef);

  if (snapshot.empty) {
    return {
      totalBusinesses: 0,
      processed: 0,
      totals: {
        scanned: 0,
        affected: 0,
        updated: 0,
        fieldsConverted: 0,
      },
      summaries: [],
      dryRun,
    };
  }

  const businessIDs = snapshot.docs.map((doc) => doc.id);
  return processBusinessList({ businessIDs, dryRun, batchSize, onProgress });
};
