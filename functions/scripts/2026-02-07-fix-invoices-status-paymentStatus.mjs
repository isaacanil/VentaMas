/**
 * One-off migration: Fix corrupted invoice lifecycle status and ensure paymentStatus fields exist.
 *
 * What it does:
 * - If `data.status` is boolean or 'paid'/'partial' (payment status leaked into lifecycle),
 *   it rewrites it to the lifecycle enum: 'pending'|'completed'|'cancelled'.
 * - Ensures `data.balanceDue`, `data.accumulatedPaid`, `data.paymentStatus` are consistent
 *   (derived from totals and existing fields).
 *
 * Usage (from repo root):
 *   cd functions
 *   node scripts/2026-02-07-fix-invoices-status-paymentStatus.mjs --businessId=BUSINESS_ID --dryRun=1
 *   node scripts/2026-02-07-fix-invoices-status-paymentStatus.mjs --businessId=BUSINESS_ID --dryRun=0
 *
 * Prereqs:
 * - Firebase Admin credentials configured (e.g. GOOGLE_APPLICATION_CREDENTIALS),
 *   or running in an environment where admin SDK can initialize.
 */

import fs from 'node:fs';
import admin from 'firebase-admin';

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .map((raw) => raw.split('='))
      .map(([k, v]) => [k.replace(/^--/, ''), v ?? '']),
  );
  return {
    businessId: args.businessId || '',
    dryRun: args.dryRun !== '0',
    limit: args.limit ? Number(args.limit) : null,
    listBusinesses: args.listBusinesses === '1',
    listBusinessesLimit: args.listBusinessesLimit
      ? Number(args.listBusinessesLimit)
      : 25,
    samples: args.samples ? Number(args.samples) : 5,
    keyPath: args.keyPath || '',
    projectId: args.projectId || '',
    fixPayments: args.fixPayments === '1',
    includeAR: args.includeAR === '1',

    // Discovery helper: rank businesses by AR usage so we can pick a businessId with real data.
    rankBusinesses: args.rankBusinesses === '1',
    rankBy: args.rankBy || 'ar', // ar|arPayments|arTotal
    rankLimit: args.rankLimit ? Number(args.rankLimit) : 25,
  };
};

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const roundToTwoDecimals = (v) => {
  const n = safeNumber(v);
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

const resolveTotal = (data) =>
  safeNumber(data?.totalPurchase?.value ?? data?.totalAmount ?? 0);

const resolvePosPaid = (data) => {
  const paymentGross = safeNumber(data?.payment?.value ?? 0);
  const changeGross = safeNumber(data?.change?.value ?? 0);
  return Math.max(0, paymentGross - changeGross);
};

const parseAmountFromArPayment = (payment) => {
  if (!payment || typeof payment !== 'object') return 0;

  const candidates = [
    payment?.amount,
    payment?.totalPaid,
    payment?.totalAmount,
    payment?.paymentAmount,
  ];
  for (const value of candidates) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && Math.abs(numeric) > 0) return numeric;
  }
  return 0;
};

const resolvePaymentStatus = ({ paid, total, balanceDue }) => {
  const threshold = 0.01;
  if (balanceDue <= threshold) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
};

const resolveLifecycleStatus = (data) => {
  const raw = data?.status;

  // If already valid lifecycle enum, keep as-is.
  if (raw === 'pending' || raw === 'completed' || raw === 'cancelled') {
    return raw;
  }

  // If preorder doc (no NCF + marked as preorder) default to pending.
  const hasNcf = Boolean(String(data?.NCF ?? data?.comprobante ?? '').trim());
  const isPreorder =
    data?.type === 'preorder' || data?.preorderDetails?.isOrWasPreorder === true;
  if (!hasNcf && isPreorder) {
    return raw === 'cancelled' ? 'cancelled' : 'pending';
  }

  // Otherwise, this is (or was) an invoice. Prefer completed.
  return raw === 'cancelled' ? 'cancelled' : 'completed';
};

const main = async () => {
  const {
    businessId,
    dryRun,
    limit,
    listBusinesses,
    listBusinessesLimit,
    samples,
    keyPath,
    projectId,
    fixPayments,
    includeAR,
    rankBusinesses,
    rankBy,
    rankLimit,
  } = parseArgs();

  if (!admin.apps.length) {
    if (keyPath) {
      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      const resolvedProjectId = projectId || serviceAccount?.project_id || undefined;

      // Ensure Firestore can resolve a project id even outside GCP runtime.
      if (resolvedProjectId && !process.env.GOOGLE_CLOUD_PROJECT) {
        process.env.GOOGLE_CLOUD_PROJECT = resolvedProjectId;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: resolvedProjectId,
      });
    } else {
      admin.initializeApp();
    }
  }
  const db = admin.firestore();

  if (listBusinesses) {
    const safeLimit =
      Number.isFinite(listBusinessesLimit) && listBusinessesLimit > 0
        ? Math.min(listBusinessesLimit, 500)
        : 25;

    const snap = await db.collection('businesses').limit(safeLimit).get();
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            name: data?.business?.name ?? data?.name ?? null,
            rnc: data?.business?.rnc ?? data?.business?.RNC ?? null,
            keys: Object.keys(data).slice(0, 20),
          };
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (rankBusinesses) {
    const safeBusinessesLimit =
      Number.isFinite(listBusinessesLimit) && listBusinessesLimit > 0
        ? Math.min(listBusinessesLimit, 500)
        : 25;
    const safeRankLimit =
      Number.isFinite(rankLimit) && rankLimit > 0 ? Math.min(rankLimit, 200) : 25;

    const bizSnap = await db.collection('businesses').limit(safeBusinessesLimit).get();
    const rows = [];

    for (const d of bizSnap.docs) {
      const data = d.data() || {};
      const name = data?.business?.name ?? data?.name ?? null;
      const rnc = data?.business?.rnc ?? data?.business?.RNC ?? null;

      let arCount = null;
      let arPaymentsCount = null;

      try {
        // Aggregate count is much cheaper than reading docs and works well for quick ranking.
        const arAgg = await db
          .collection(`businesses/${d.id}/accountsReceivable`)
          .count()
          .get();
        arCount = arAgg.data().count ?? 0;
      } catch {
        arCount = null;
      }

      try {
        const payAgg = await db
          .collection(`businesses/${d.id}/accountsReceivablePayments`)
          .count()
          .get();
        arPaymentsCount = payAgg.data().count ?? 0;
      } catch {
        arPaymentsCount = null;
      }

      const score =
        rankBy === 'arPayments'
          ? safeNumber(arPaymentsCount)
          : rankBy === 'arTotal'
            ? safeNumber(arCount) + safeNumber(arPaymentsCount)
            : safeNumber(arCount);

      rows.push({
        id: d.id,
        name,
        rnc,
        arCount,
        arPaymentsCount,
        score,
      });
    }

    rows.sort((a, b) => safeNumber(b.score) - safeNumber(a.score));

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          scannedBusinesses: rows.length,
          rankBy,
          top: rows.slice(0, safeRankLimit),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (!businessId) {
    throw new Error(
      'Missing --businessId=BUSINESS_ID. Tip: run with --listBusinesses=1 to discover ids.',
    );
  }

  const invoicesRef = db.collection(`businesses/${businessId}/invoices`);
  // Safety: only scan up to `limit` docs when provided to avoid loading the full collection.
  const snap = limit ? await invoicesRef.limit(limit).get() : await invoicesRef.get();

  let scanned = 0;
  let changed = 0;
  const statusTypeCounts = {};
  const statusValueCounts = {};
  const samplesOut = [];

  const batchSize = 450;
  let batch = db.batch();
  let ops = 0;

  const commitBatch = async () => {
    if (ops === 0) return;
    if (!dryRun) await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const docSnap of snap.docs) {
    scanned++;
    if (limit && scanned > limit) break;

    const raw = docSnap.data() || {};
    const data = raw?.data || {};

    const statusRaw = data?.status;
    const statusType =
      statusRaw === null ? 'null' : Array.isArray(statusRaw) ? 'array' : typeof statusRaw;
    statusTypeCounts[statusType] = (statusTypeCounts[statusType] || 0) + 1;
    if (typeof statusRaw === 'string') {
      statusValueCounts[statusRaw] = (statusValueCounts[statusRaw] || 0) + 1;
    }
    const isCorruptedLifecycle =
      typeof statusRaw === 'boolean' || statusRaw === 'paid' || statusRaw === 'partial';

    const total = resolveTotal(data);
    const posPaid = resolvePosPaid(data);

    let arPaid = 0;
    if (includeAR) {
      const arSnap = await db
        .collection(`businesses/${businessId}/accountsReceivable`)
        .where('invoiceId', '==', docSnap.id)
        .get();
      const arIds = arSnap.docs.map((d) => d.id);

      for (const arId of arIds) {
        const paymentsSnap = await db
          .collection(`businesses/${businessId}/accountsReceivablePayments`)
          .where('arId', '==', arId)
          .get();
        paymentsSnap.forEach((p) => {
          arPaid += parseAmountFromArPayment(p.data());
        });
      }
    }

    const accumulatedPaid = fixPayments ? posPaid + arPaid : safeNumber(data?.accumulatedPaid);
    const balanceDue = Math.max(0, total - accumulatedPaid);
    const paymentStatus = resolvePaymentStatus({
      paid: accumulatedPaid,
      total,
      balanceDue,
    });
    const lifecycleStatus = resolveLifecycleStatus(data);

    const isLifecycleValid =
      statusRaw === 'pending' || statusRaw === 'completed' || statusRaw === 'cancelled';

    const patch = {};

    if (!isLifecycleValid || isCorruptedLifecycle) {
      patch['data.status'] = lifecycleStatus;
    }

    if (fixPayments) {
      const nextAccumulatedPaid = roundToTwoDecimals(accumulatedPaid);
      const nextBalanceDue = roundToTwoDecimals(balanceDue);

      const prevAccumulatedRaw = data?.accumulatedPaid;
      const prevBalanceRaw = data?.balanceDue;
      const prevPaymentStatus = data?.paymentStatus;

      const prevAccumulatedPaid = safeNumber(prevAccumulatedRaw);
      const prevBalanceDue = safeNumber(prevBalanceRaw);

      if (prevAccumulatedRaw === undefined || prevAccumulatedPaid !== nextAccumulatedPaid) {
        patch['data.accumulatedPaid'] = nextAccumulatedPaid;
      }
      if (prevBalanceRaw === undefined || prevBalanceDue !== nextBalanceDue) {
        patch['data.balanceDue'] = nextBalanceDue;
      }
      if (prevPaymentStatus === undefined || prevPaymentStatus !== paymentStatus) {
        patch['data.paymentStatus'] = paymentStatus;
      }
    }

    const shouldWrite = Object.keys(patch).length > 0;
    if (!shouldWrite) continue;

    changed++;

    if (dryRun) {
      if (samplesOut.length < samples) {
        samplesOut.push({
          id: docSnap.id,
          prevStatus: statusRaw,
          prevType: data?.type ?? null,
          hasNcf: Boolean(String(data?.NCF ?? data?.comprobante ?? '').trim()),
          isPreorder: Boolean(
            data?.type === 'preorder' || data?.preorderDetails?.isOrWasPreorder === true,
          ),
          rawKeys: Object.keys(raw).slice(0, 25),
          dataKeys: Object.keys(data).slice(0, 25),
          total,
          posPaid: roundToTwoDecimals(posPaid),
          arPaid: roundToTwoDecimals(arPaid),
          computedAccumulatedPaid: roundToTwoDecimals(accumulatedPaid),
          computedBalanceDue: roundToTwoDecimals(balanceDue),
          computedPaymentStatus: paymentStatus,
          patch,
        });
      }
    } else {
      batch.update(docSnap.ref, patch);
      ops++;
      if (ops >= batchSize) {
        await commitBatch();
      }
    }
  }

  await commitBatch();

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        businessId,
        dryRun,
        projectId:
          admin.app().options.projectId ||
          process.env.GOOGLE_CLOUD_PROJECT ||
          process.env.GCLOUD_PROJECT ||
          null,
        fixPayments,
        includeAR,
        scanned,
        changed,
        statusTypeCounts,
        statusValueCounts,
        samples: samplesOut,
      },
      null,
      2,
    ),
  );
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
