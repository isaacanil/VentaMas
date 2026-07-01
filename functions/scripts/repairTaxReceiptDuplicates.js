/*
  Script: repairTaxReceiptDuplicates.js

  Purpose:
    Scans businesses/{businessId}/taxReceipts for active duplicate tax receipts
    and disables the non-canonical documents. The survivor is selected by the
    most advanced fiscal sequence, then by quantity, then by stable document id.

  Uso (PowerShell):
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\Dev\\keys\\VentaMas\\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json"
    node functions/scripts/repairTaxReceiptDuplicates.js --projectId ventamaxpos --dry-run
    node functions/scripts/repairTaxReceiptDuplicates.js --projectId ventamaxpos --write
    node functions/scripts/repairTaxReceiptDuplicates.js --projectId ventamaxpos --businessId <id> --dry-run
*/

import process from 'process';
import admin from 'firebase-admin';

const SCRIPT_NAME = 'repairTaxReceiptDuplicates';

const getFlag = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const hasFlag = (args, name) => args.includes(name);

const toCleanString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeTaxReceiptLabel = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

const normalizeTaxReceiptCode = (value) => {
  const normalized = normalizeTaxReceiptLabel(value).replace(/[^A-Z0-9]/g, '');
  if (/^\d$/.test(normalized)) return normalized.padStart(2, '0');
  return normalized;
};

const getTaxReceiptIdentity = (data) => {
  const type = normalizeTaxReceiptCode(data?.type);
  const serie = normalizeTaxReceiptCode(data?.serie ?? data?.series);
  const name = normalizeTaxReceiptLabel(data?.name);

  return {
    name,
    type,
    serie,
    fiscalKey: `${type}${serie}`,
  };
};

const asBigInt = (value) => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string') {
    const digits = value.trim().replace(/\D/g, '');
    if (digits) return BigInt(digits);
  }
  return 0n;
};

const compareBigInt = (left, right) => {
  if (left > right) return 1;
  if (left < right) return -1;
  return 0;
};

const getTimestampMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};

const sharesIdentity = (left, right) =>
  (!!left.identity.fiscalKey &&
    left.identity.fiscalKey === right.identity.fiscalKey) ||
  (!!left.identity.name && left.identity.name === right.identity.name);

const isActiveReceipt = (receipt) => receipt.data?.disabled !== true;

const buildReceiptRecord = (docSnap) => {
  const payload = docSnap.data() || {};
  const data = payload.data || {};
  const identity = getTaxReceiptIdentity(data);
  const sequence = asBigInt(data.sequence);
  const quantity = asBigInt(data.quantity);
  const canonicalDocId = identity.serie || docSnap.id;
  const stableDocScore = docSnap.id === canonicalDocId ? 1 : 0;
  const updatedAt = getTimestampMillis(data.updatedAt ?? payload.updatedAt);
  const createdAt = getTimestampMillis(data.createdAt ?? payload.createdAt);

  return {
    id: docSnap.id,
    ref: docSnap.ref,
    data,
    identity,
    sequence,
    quantity,
    stableDocScore,
    updatedAt,
    createdAt,
    active: isActiveReceipt({ data }),
  };
};

const findDuplicateGroups = (receipts) => {
  const groups = [];
  const activeReceipts = receipts.filter((receipt) => receipt.active);

  for (const receipt of activeReceipts) {
    let targetGroup = null;
    for (const group of groups) {
      if (group.some((existing) => sharesIdentity(existing, receipt))) {
        targetGroup = group;
        break;
      }
    }

    if (targetGroup) {
      targetGroup.push(receipt);
    } else {
      groups.push([receipt]);
    }
  }

  return groups.filter((group) => group.length > 1);
};

const chooseSurvivor = (group) =>
  [...group].sort((left, right) => {
    const sequenceCompare = compareBigInt(right.sequence, left.sequence);
    if (sequenceCompare !== 0) return sequenceCompare;

    const quantityCompare = compareBigInt(right.quantity, left.quantity);
    if (quantityCompare !== 0) return quantityCompare;

    if (right.stableDocScore !== left.stableDocScore) {
      return right.stableDocScore - left.stableDocScore;
    }

    if (right.updatedAt !== left.updatedAt)
      return right.updatedAt - left.updatedAt;
    if (right.createdAt !== left.createdAt)
      return right.createdAt - left.createdAt;
    return left.id.localeCompare(right.id);
  })[0];

const formatReceipt = (receipt) => ({
  id: receipt.id,
  name: receipt.data?.name ?? null,
  fiscalKey: receipt.identity.fiscalKey || null,
  sequence: receipt.sequence.toString(),
  quantity: receipt.quantity.toString(),
  disabled: receipt.data?.disabled === true,
});

const commitBatch = async (db, operations) => {
  const chunks = [];
  for (let i = 0; i < operations.length; i += 450) {
    chunks.push(operations.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach((operation) => operation(batch));
    await batch.commit();
  }
};

const summarizeBusinessName = (businessSnap) => {
  const data = businessSnap.data() || {};
  return (
    toCleanString(data?.business?.name) ||
    toCleanString(data?.business?.businessName) ||
    toCleanString(data?.name) ||
    null
  );
};

const args = process.argv.slice(2);
const businessId = toCleanString(getFlag(args, '--businessId'));
const projectId =
  toCleanString(getFlag(args, '--projectId')) ||
  toCleanString(process.env.GOOGLE_CLOUD_PROJECT) ||
  toCleanString(process.env.GCLOUD_PROJECT);
const isWrite = hasFlag(args, '--write');
const isDryRun = !isWrite || hasFlag(args, '--dry-run');

if (!admin.apps.length) {
  admin.initializeApp(projectId ? { projectId } : undefined);
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const scanBusiness = async (businessSnap) => {
  const receiptsSnap = await businessSnap.ref.collection('taxReceipts').get();
  const receipts = receiptsSnap.docs.map(buildReceiptRecord);
  const duplicateGroups = findDuplicateGroups(receipts);
  const writeOperations = [];
  const groups = [];

  duplicateGroups.forEach((group) => {
    const survivor = chooseSurvivor(group);
    const duplicates = group.filter((receipt) => receipt.id !== survivor.id);
    const fiscalKeys = Array.from(
      new Set(
        group.map((receipt) => receipt.identity.fiscalKey).filter(Boolean),
      ),
    );
    const names = Array.from(
      new Set(group.map((receipt) => receipt.identity.name).filter(Boolean)),
    );

    groups.push({
      fiscalKeys,
      names,
      survivor: formatReceipt(survivor),
      disabledCandidates: duplicates.map(formatReceipt),
    });

    writeOperations.push((batch) => {
      batch.set(
        survivor.ref,
        {
          data: {
            id: survivor.id,
            disabled: false,
            duplicateRepair: {
              status: 'survivor',
              script: SCRIPT_NAME,
              repairedAt: FieldValue.serverTimestamp(),
              duplicateIds: duplicates.map((receipt) => receipt.id),
            },
          },
        },
        { merge: true },
      );
    });

    duplicates.forEach((duplicate) => {
      writeOperations.push((batch) => {
        batch.set(
          duplicate.ref,
          {
            data: {
              id: duplicate.id,
              disabled: true,
              duplicateRepair: {
                status: 'disabled_duplicate',
                script: SCRIPT_NAME,
                repairedAt: FieldValue.serverTimestamp(),
                survivorId: survivor.id,
                fiscalKeys,
                names,
              },
            },
          },
          { merge: true },
        );
      });
    });
  });

  return {
    businessId: businessSnap.id,
    businessName: summarizeBusinessName(businessSnap),
    receiptCount: receipts.length,
    activeReceiptCount: receipts.filter((receipt) => receipt.active).length,
    duplicateGroupCount: duplicateGroups.length,
    writes: writeOperations.length,
    groups,
    writeOperations,
  };
};

const run = async () => {
  console.log(`[${SCRIPT_NAME}] projectId:`, projectId || '(default ADC)');
  console.log(`[${SCRIPT_NAME}] mode:`, isDryRun ? 'dry-run' : 'write');
  if (businessId) console.log(`[${SCRIPT_NAME}] businessId:`, businessId);

  const businessSnaps = businessId
    ? [await db.collection('businesses').doc(businessId).get()]
    : (await db.collection('businesses').get()).docs;

  const existingBusinessSnaps = businessSnaps.filter((snap) => snap.exists);
  const results = [];
  const writeOperations = [];

  for (const businessSnap of existingBusinessSnaps) {
    const result = await scanBusiness(businessSnap);
    if (result.duplicateGroupCount > 0) {
      results.push(result);
      writeOperations.push(...result.writeOperations);
    }
  }

  const report = {
    projectId: admin.app().options.projectId || projectId || null,
    mode: isDryRun ? 'dry-run' : 'write',
    scannedBusinesses: existingBusinessSnaps.length,
    businessesWithDuplicates: results.length,
    duplicateGroups: results.reduce(
      (total, result) => total + result.duplicateGroupCount,
      0,
    ),
    writesPlanned: writeOperations.length,
    businesses: results.map(({ writeOperations: _ops, ...result }) => result),
  };

  console.log(JSON.stringify(report, null, 2));

  if (isDryRun || writeOperations.length === 0) return;

  await commitBatch(db, writeOperations);
  console.log(
    `[${SCRIPT_NAME}] committed ${writeOperations.length} repair writes.`,
  );
};

run().catch((error) => {
  console.error(`[${SCRIPT_NAME}] Failed:`, error);
  process.exit(1);
});
