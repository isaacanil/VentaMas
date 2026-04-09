/**
 * Analyze an exported business data pack created by export-business-data.mjs.
 *
 * Usage:
 *   cd functions
 *   node scripts/data-audit/analyze-business-pack.mjs --inDir=C:\path\to\pack\raw
 *
 * Output:
 *   <inDir>\..\analysis\cash-count-audit.json
 *   <inDir>\..\analysis\cash-count-audit.md
 *   <inDir>\..\analysis\invariants.json
 *   <inDir>\..\analysis\invariants.md
 *
 * Notes:
 * - This is a best-effort analyzer. It does not query Firestore.
 * - The pack can be sanitized or full; we only rely on numeric/timestamp-ish fields.
 */

import fs from 'node:fs';
import path from 'node:path';

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .map((raw) => raw.split('='))
      .map(([k, v]) => [k.replace(/^--/, ''), v ?? '']),
  );

  return {
    inDir: args.inDir || '',
    outDir: args.outDir || '',
    cashCountId: args.cashCountId || '',
    tolerance: Number.isFinite(Number(args.tolerance)) ? Number(args.tolerance) : 0.01,
  };
};

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const writeJson = (filePath, value) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
};

const writeText = (filePath, value) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, 'utf8');
};

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (v) => Math.round((safeNumber(v) + Number.EPSILON) * 100) / 100;

const absDiff = (a, b) => Math.abs(safeNumber(a) - safeNumber(b));

const isTsLike = (v) =>
  v &&
  typeof v === 'object' &&
  v.__type === 'Timestamp' &&
  typeof v.iso === 'string' &&
  !Number.isNaN(Date.parse(v.iso));

const toMillis = (v) => {
  if (!v) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v; // already millis-ish
  if (typeof v === 'string') {
    const ms = Date.parse(v);
    return Number.isNaN(ms) ? null : ms;
  }
  if (isTsLike(v)) return Date.parse(v.iso);
  // Some docs store Firestore Timestamp as {seconds, nanoseconds}
  if (typeof v === 'object' && Number.isFinite(Number(v.seconds))) {
    return Number(v.seconds) * 1000;
  }
  return null;
};

const readDirDocs = (folder) => {
  if (!fs.existsSync(folder)) return [];
  const files = fs
    .readdirSync(folder)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.resolve(folder, f));
  return files.map((fp) => ({ filePath: fp, doc: readJson(fp) }));
};

const indexBy = (items, keyFn) => {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (k == null) continue;
    m.set(k, it);
  }
  return m;
};

const groupBy = (items, keyFn) => {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (k == null) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return m;
};

const listAllInvoiceDocs = (inDir) => {
  const base = path.resolve(inDir, 'factura', 'invoices');
  const preorderBase = path.resolve(inDir, 'preventa', 'preorders');
  const invoices = readDirDocs(base).map(({ filePath, doc }) => ({
    id: path.basename(filePath, '.json'),
    doc,
    kind: 'invoice',
  }));
  const preorders = readDirDocs(preorderBase).map(({ filePath, doc }) => ({
    id: path.basename(filePath, '.json'),
    doc,
    kind: 'preorder',
  }));
  return [...invoices, ...preorders];
};

const resolveInvoiceTotals = (invoiceDoc) => {
  const data = invoiceDoc?.data || {};
  const total = safeNumber(data?.totalPurchase?.value ?? data?.totalAmount ?? 0);
  const paymentGross = safeNumber(data?.payment?.value ?? 0);
  const changeGross = safeNumber(data?.change?.value ?? 0);
  const posPaid = Math.max(0, paymentGross - changeGross);
  const accumulatedPaid = safeNumber(data?.accumulatedPaid);
  const balanceDue = safeNumber(data?.balanceDue);
  const lifecycleStatus = data?.status ?? invoiceDoc?.status ?? null;
  const paymentStatus = data?.paymentStatus ?? invoiceDoc?.paymentStatus ?? null;
  const cashCountId = data?.cashCountId ?? data?.cashCountID ?? null;
  return {
    total: round2(total),
    posPaid: round2(posPaid),
    accumulatedPaid: round2(accumulatedPaid),
    balanceDue: round2(balanceDue),
    lifecycleStatus,
    paymentStatus,
    cashCountId,
    paymentMethod: data?.paymentMethod ?? null,
  };
};

const sumInvoicePaymentMethods = (paymentMethod) => {
  // Canonical invoices store paymentMethod as array of {method, value, status}
  // We only sum items with status truthy.
  if (!Array.isArray(paymentMethod)) return { card: 0, transfer: 0, cash: 0, other: 0 };
  let card = 0;
  let transfer = 0;
  let cash = 0;
  let other = 0;
  for (const it of paymentMethod) {
    if (!it || !it.status) continue;
    const method = String(it.method || '').toLowerCase();
    const v = safeNumber(it.value);
    if (method.includes('card') || method.includes('tarjeta')) card += v;
    else if (method.includes('transfer')) transfer += v;
    else if (method.includes('cash') || method.includes('efectivo')) cash += v;
    else other += v;
  }
  return { card: round2(card), transfer: round2(transfer), cash: round2(cash), other: round2(other) };
};

const resolveCashCountCore = (cashCountDoc) => {
  // Expect structure { cashCount: { opening: {..}, closing: {..}, receivablePayments: [], sales: [] }, totalCard, ... }
  const cc = cashCountDoc?.cashCount || cashCountDoc?.data?.cashCount || cashCountDoc || {};
  const opening = cc?.opening || {};
  const closing = cc?.closing || {};
  const openingMs =
    toMillis(opening?.openAt) ??
    toMillis(opening?.date) ??
    toMillis(cashCountDoc?.cashCount?.opening?.openAt) ??
    null;
  const closingMs =
    toMillis(closing?.closeAt) ??
    toMillis(closing?.date) ??
    toMillis(cashCountDoc?.cashCount?.closing?.closeAt) ??
    null;

  const receivablePayments = Array.isArray(cc?.receivablePayments) ? cc.receivablePayments : [];
  const sales = Array.isArray(cc?.sales) ? cc.sales : [];

  return {
    openingMs,
    closingMs,
    opening,
    closing,
    receivablePayments,
    sales,
  };
};

const sumReceivablePayments = (receivablePayments) => {
  let cash = 0;
  let card = 0;
  let transfer = 0;
  let other = 0;

  for (const p of receivablePayments || []) {
    const method = String(p?.method || p?.paymentMethod || '').toLowerCase();
    const amount = safeNumber(p?.amount ?? p?.totalPaid ?? p?.value ?? 0);
    if (method.includes('card') || method.includes('tarjeta')) card += amount;
    else if (method.includes('transfer')) transfer += amount;
    else if (method.includes('cash') || method.includes('efectivo')) cash += amount;
    else other += amount;
  }

  return { cash: round2(cash), card: round2(card), transfer: round2(transfer), other: round2(other) };
};

const sumBanknotes = (banknotes) => {
  // banknotes can be [{value, qty}] or object map; best-effort
  if (!banknotes) return 0;
  if (Array.isArray(banknotes)) {
    return round2(
      banknotes.reduce((acc, it) => acc + safeNumber(it?.value) * safeNumber(it?.qty ?? it?.quantity ?? 0), 0),
    );
  }
  if (typeof banknotes === 'object') {
    // { "100": 2, "50": 1 }
    return round2(
      Object.entries(banknotes).reduce((acc, [k, v]) => acc + safeNumber(k) * safeNumber(v), 0),
    );
  }
  return 0;
};

const resolveExpenseCashCountId = (expenseDoc) => {
  // Most likely: expense.payment.cashRegister == cashCountId
  return (
    expenseDoc?.payment?.cashRegister ||
    expenseDoc?.expense?.payment?.cashRegister ||
    expenseDoc?.payment?.cashCountId ||
    expenseDoc?.cashCountId ||
    null
  );
};

const resolveExpenseAmount = (expenseDoc) => {
  return safeNumber(
    expenseDoc?.amount ??
      expenseDoc?.value ??
      expenseDoc?.expense?.amount ??
      expenseDoc?.expense?.value ??
      expenseDoc?.payment?.value ??
      0,
  );
};

const computeCashCountAudit = ({ inDir, tolerance, cashCountId }) => {
  const cashCountsFolder = path.resolve(inDir, 'cuadre-de-caja', 'cashCounts');
  const cashCounts = readDirDocs(cashCountsFolder).map(({ filePath, doc }) => ({
    id: path.basename(filePath, '.json'),
    doc,
  }));

  const invoices = listAllInvoiceDocs(inDir).map(({ id, doc, kind }) => ({
    id,
    kind,
    raw: doc,
    totals: resolveInvoiceTotals(doc),
  }));
  const invoicesByCashCountId = groupBy(invoices, (i) => i.totals.cashCountId);

  const expensesFolder = path.resolve(inDir, 'gastos', 'expenses');
  const expenses = readDirDocs(expensesFolder).map(({ filePath, doc }) => ({
    id: path.basename(filePath, '.json'),
    raw: doc,
  }));
  const expensesByCashCountId = groupBy(expenses, (e) => resolveExpenseCashCountId(e.raw));

  const results = [];

  const filteredCashCounts = cashCountId
    ? cashCounts.filter((c) => c.id === cashCountId)
    : cashCounts;

  for (const cc of filteredCashCounts) {
    const ccCore = resolveCashCountCore(cc.doc);
    const openingCash = sumBanknotes(ccCore.opening?.banknotes ?? ccCore.opening?.bankNotes);
    const closingCash = sumBanknotes(ccCore.closing?.banknotes ?? ccCore.closing?.bankNotes);

    const ccReceivables = sumReceivablePayments(ccCore.receivablePayments);
    const ccInvoiceList = (invoicesByCashCountId.get(cc.id) || []).filter(
      (inv) => inv.totals.lifecycleStatus !== 'cancelled',
    );

    // Totals from invoices
    let invoicePosPaid = 0;
    let invoiceTotalPurchase = 0;
    let invoiceCard = 0;
    let invoiceTransfer = 0;

    const invoiceIds = [];
    for (const inv of ccInvoiceList) {
      invoiceIds.push(inv.id);
      invoicePosPaid += safeNumber(inv.totals.posPaid);
      invoiceTotalPurchase += safeNumber(inv.totals.total);
      const methods = sumInvoicePaymentMethods(inv.totals.paymentMethod);
      invoiceCard += safeNumber(methods.card);
      invoiceTransfer += safeNumber(methods.transfer);
    }

    invoicePosPaid = round2(invoicePosPaid);
    invoiceTotalPurchase = round2(invoiceTotalPurchase);
    invoiceCard = round2(invoiceCard);
    invoiceTransfer = round2(invoiceTransfer);

    // Expenses linked to the cashCountId
    const linkedExpenses = expensesByCashCountId.get(cc.id) || [];
    const expenseIds = [];
    let expenseTotal = 0;
    for (const e of linkedExpenses) {
      expenseIds.push(e.id);
      expenseTotal += resolveExpenseAmount(e.raw);
    }
    expenseTotal = round2(expenseTotal);

    // System formulas (from plans/cash-count-audit.md)
    const totalCard = round2(invoiceCard + ccReceivables.card);
    const totalTransfer = round2(invoiceTransfer + ccReceivables.transfer);
    const totalReceivables = round2(ccReceivables.cash + ccReceivables.card + ccReceivables.transfer + ccReceivables.other);
    const totalChargedSnapshot = round2(invoicePosPaid);
    const totalChargedFacturado = round2(invoiceTotalPurchase);
    const totalSystemSnapshot = round2(totalChargedSnapshot + totalReceivables + openingCash - expenseTotal);
    const totalSystemFacturado = round2(totalChargedFacturado + totalReceivables + openingCash - expenseTotal);
    const totalRegister = round2(closingCash + totalCard + totalTransfer);
    const discrepancySnapshot = round2(totalRegister - totalSystemSnapshot);
    const discrepancyFacturado = round2(totalRegister - totalSystemFacturado);

    // Stored totals (best-effort)
    const stored = {
      totalCard: safeNumber(cc.doc?.totalCard ?? cc.doc?.cashCount?.totalCard ?? cc.doc?.cashCount?.totals?.totalCard),
      totalTransfer: safeNumber(
        cc.doc?.totalTransfer ?? cc.doc?.cashCount?.totalTransfer ?? cc.doc?.cashCount?.totals?.totalTransfer,
      ),
      totalCharged: safeNumber(
        cc.doc?.totalCharged ?? cc.doc?.cashCount?.totalCharged ?? cc.doc?.cashCount?.totals?.totalCharged,
      ),
      totalReceivables: safeNumber(
        cc.doc?.totalReceivables ?? cc.doc?.cashCount?.totalReceivables ?? cc.doc?.cashCount?.totals?.totalReceivables,
      ),
      totalSystem: safeNumber(
        cc.doc?.totalSystem ?? cc.doc?.cashCount?.totalSystem ?? cc.doc?.cashCount?.totals?.totalSystem,
      ),
      totalRegister: safeNumber(
        cc.doc?.totalRegister ?? cc.doc?.cashCount?.totalRegister ?? cc.doc?.cashCount?.totals?.totalRegister,
      ),
      totalDiscrepancy: safeNumber(
        cc.doc?.totalDiscrepancy ??
          cc.doc?.cashCount?.totalDiscrepancy ??
          cc.doc?.cashCount?.totals?.totalDiscrepancy,
      ),
    };

    const diffs = {
      totalCard: round2(totalCard - stored.totalCard),
      totalTransfer: round2(totalTransfer - stored.totalTransfer),
      totalCharged_snapshot: round2(totalChargedSnapshot - stored.totalCharged),
      totalReceivables: round2(totalReceivables - stored.totalReceivables),
      totalSystem_snapshot: round2(totalSystemSnapshot - stored.totalSystem),
      totalRegister: round2(totalRegister - stored.totalRegister),
      totalDiscrepancy_snapshot: round2(discrepancySnapshot - stored.totalDiscrepancy),
    };

    const flags = [];
    for (const [k, v] of Object.entries(diffs)) {
      if (absDiff(v, 0) > tolerance) flags.push({ kind: 'diff', key: k, diff: v });
    }

    if (ccCore.openingMs && ccCore.closingMs && ccCore.closingMs < ccCore.openingMs) {
      flags.push({ kind: 'invalid_window', openingMs: ccCore.openingMs, closingMs: ccCore.closingMs });
    }

    results.push({
      cashCountId: cc.id,
      inputs: {
        openingCash,
        closingCash,
        invoiceCount: ccInvoiceList.length,
        invoiceIds,
        receivablePayments: ccReceivables,
        expensesTotal: expenseTotal,
        expenseIds,
      },
      computed: {
        totalCard,
        totalTransfer,
        totalReceivables,
        totalCharged_snapshot: totalChargedSnapshot,
        totalCharged_facturado: totalChargedFacturado,
        totalSystem_snapshot: totalSystemSnapshot,
        totalSystem_facturado: totalSystemFacturado,
        totalRegister,
        discrepancy_snapshot: discrepancySnapshot,
        discrepancy_facturado: discrepancyFacturado,
      },
      stored,
      diffs,
      flags,
    });
  }

  // Order by opening date when available, else by id
  results.sort((a, b) => String(a.cashCountId).localeCompare(String(b.cashCountId)));
  return results;
};

const computeInvariants = ({ inDir, tolerance, cashCountId }) => {
  const invoices = listAllInvoiceDocs(inDir).map(({ id, doc, kind }) => ({
    id,
    kind,
    raw: doc,
    totals: resolveInvoiceTotals(doc),
  }));

  const filteredInvoices = cashCountId
    ? invoices.filter((i) => i.totals.cashCountId === cashCountId)
    : invoices;

  const arFolder = path.resolve(inDir, 'cuentas-por-cobrar', 'accountsReceivable');
  const ars = readDirDocs(arFolder).map(({ filePath, doc }) => ({
    id: path.basename(filePath, '.json'),
    raw: doc,
    invoiceId: doc?.invoiceId ?? doc?.invoiceID ?? doc?.sourceId ?? null,
    sourceType: doc?.sourceType ?? doc?.originType ?? null,
    totalReceivable: safeNumber(doc?.totalReceivable ?? doc?.totalCXC ?? doc?.total ?? 0),
    balance: safeNumber(doc?.balance ?? doc?.balanceDue ?? doc?.pendingBalance ?? 0),
  }));

  const arByInvoiceId = groupBy(ars, (a) => a.invoiceId);

  const cnFolder = path.resolve(inDir, 'nota-de-credito', 'creditNotes');
  const cns = readDirDocs(cnFolder).map(({ filePath, doc }) => ({
    id: path.basename(filePath, '.json'),
    raw: doc,
    invoiceId: doc?.invoiceId ?? doc?.invoiceID ?? doc?.data?.invoiceId ?? null,
    total: safeNumber(doc?.total ?? doc?.amount ?? doc?.data?.total ?? 0),
  }));

  const cnAppFolder = path.resolve(inDir, 'nota-de-credito', 'creditNoteApplications');
  const apps = readDirDocs(cnAppFolder).map(({ filePath, doc }) => ({
    id: path.basename(filePath, '.json'),
    raw: doc,
    creditNoteId: doc?.creditNoteId ?? doc?.creditNoteID ?? doc?.noteId ?? doc?.noteID ?? null,
    invoiceId: doc?.invoiceId ?? doc?.invoiceID ?? doc?.data?.invoiceId ?? null,
    amount: safeNumber(doc?.amount ?? doc?.value ?? doc?.data?.amount ?? 0),
  }));

  const cnById = indexBy(cns, (c) => c.id);

  const invFolder = path.resolve(inDir, 'inventario', 'productsStock');
  const productsStock = readDirDocs(invFolder).map(({ filePath, doc }) => ({
    id: path.basename(filePath, '.json'),
    raw: doc,
    quantity: safeNumber(doc?.quantity ?? doc?.qty ?? doc?.stock ?? 0),
    productId: doc?.productID ?? doc?.productId ?? doc?.product?.id ?? null,
  }));

  const issues = [];

  // Invoice math invariants
  for (const inv of filteredInvoices) {
    const sum = round2(inv.totals.accumulatedPaid + inv.totals.balanceDue);
    if (absDiff(sum, inv.totals.total) > tolerance) {
      issues.push({
        kind: 'invoice_total_mismatch',
        invoiceId: inv.id,
        total: inv.totals.total,
        accumulatedPaid: inv.totals.accumulatedPaid,
        balanceDue: inv.totals.balanceDue,
        sum,
      });
    }
    if (inv.totals.balanceDue < -tolerance) {
      issues.push({
        kind: 'invoice_negative_balance',
        invoiceId: inv.id,
        balanceDue: inv.totals.balanceDue,
      });
    }
    if (inv.totals.lifecycleStatus && typeof inv.totals.lifecycleStatus !== 'string') {
      issues.push({
        kind: 'invoice_invalid_lifecycle_status_type',
        invoiceId: inv.id,
        lifecycleStatus: inv.totals.lifecycleStatus,
      });
    }
  }

  // Invoice -> AR join sanity
  for (const inv of filteredInvoices) {
    const arList = arByInvoiceId.get(inv.id) || [];
    // We don't have a strict signal field in the pack. Flag only obvious duplicates.
    if (arList.length > 1) {
      issues.push({
        kind: 'ar_duplicate_for_invoice',
        invoiceId: inv.id,
        arIds: arList.map((a) => a.id),
      });
    }
  }

  // Credit note applications referential integrity
  for (const app of apps) {
    if (app.creditNoteId && !cnById.get(app.creditNoteId)) {
      issues.push({
        kind: 'credit_note_application_missing_note',
        applicationId: app.id,
        creditNoteId: app.creditNoteId,
      });
    }
    if (!app.creditNoteId) {
      issues.push({
        kind: 'credit_note_application_missing_creditNoteId',
        applicationId: app.id,
      });
    }
  }

  // Inventory negative quantities
  for (const ps of productsStock) {
    if (ps.quantity < -tolerance) {
      issues.push({
        kind: 'productsStock_negative_quantity',
        productStockId: ps.id,
        quantity: ps.quantity,
        productId: ps.productId,
      });
    }
    if (!ps.productId) {
      issues.push({
        kind: 'productsStock_missing_productId',
        productStockId: ps.id,
      });
    }
  }

  return {
    counts: {
      invoices: filteredInvoices.length,
      accountsReceivable: ars.length,
      creditNotes: cns.length,
      creditNoteApplications: apps.length,
      productsStock: productsStock.length,
    },
    issues,
  };
};

const toMd = ({ cashCounts, invariants }) => {
  const lines = [];
  lines.push('# Data Pack Analysis');
  lines.push('');

  lines.push('## Cash Counts');
  lines.push('');
  lines.push(
    '| cashCountId | invoiceCount | openingCash | closingCash | computed.discrepancy_snapshot | stored.totalDiscrepancy | flags |',
  );
  lines.push('| - | - | - | - | - | - | - |');

  for (const cc of cashCounts) {
    const flagCount = (cc.flags || []).length;
    lines.push(
      `| ${cc.cashCountId} | ${cc.inputs.invoiceCount} | ${cc.inputs.openingCash.toFixed(
        2,
      )} | ${cc.inputs.closingCash.toFixed(2)} | ${cc.computed.discrepancy_snapshot.toFixed(
        2,
      )} | ${safeNumber(cc.stored.totalDiscrepancy).toFixed(2)} | ${flagCount} |`,
    );
  }

  lines.push('');
  lines.push('## Invariants');
  lines.push('');
  lines.push(`Docs scanned: invoices=${invariants.counts.invoices}, ar=${invariants.counts.accountsReceivable}, creditNotes=${invariants.counts.creditNotes}, creditNoteApplications=${invariants.counts.creditNoteApplications}, productsStock=${invariants.counts.productsStock}`);
  lines.push('');
  lines.push(`Issues: ${invariants.issues.length}`);
  lines.push('');
  lines.push('| kind | id | details |');
  lines.push('| - | - | - |');
  for (const issue of invariants.issues.slice(0, 200)) {
    const id =
      issue.invoiceId ||
      issue.applicationId ||
      issue.productStockId ||
      issue.cashCountId ||
      issue.creditNoteId ||
      issue.arId ||
      '';
    const details = JSON.stringify(issue);
    lines.push(`| ${issue.kind} | ${id} | \`${details.replace(/`/g, "'")}\` |`);
  }
  if (invariants.issues.length > 200) {
    lines.push('');
    lines.push(`(Showing first 200 issues; see invariants.json for full list.)`);
  }

  return lines.join('\n');
};

const main = async () => {
  const { inDir, outDir, tolerance, cashCountId } = parseArgs();
  if (!inDir) throw new Error('Missing --inDir=PACK_RAW_DIR');
  if (!fs.existsSync(inDir)) throw new Error(`inDir not found: ${inDir}`);

  const resolvedOutDir =
    outDir ||
    path.resolve(path.dirname(inDir), 'analysis');
  ensureDir(resolvedOutDir);

  const cashCounts = computeCashCountAudit({ inDir, tolerance, cashCountId });
  const invariants = computeInvariants({ inDir, tolerance, cashCountId });

  const payload = {
    inDir,
    outDir: resolvedOutDir,
    cashCountId: cashCountId || null,
    tolerance,
    generatedAt: new Date().toISOString(),
    cashCounts,
    invariants,
  };

  writeJson(path.resolve(resolvedOutDir, 'cash-count-audit.json'), cashCounts);
  writeJson(path.resolve(resolvedOutDir, 'invariants.json'), invariants);
  writeText(path.resolve(resolvedOutDir, 'analysis.md'), toMd({ cashCounts, invariants }));

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        outDir: resolvedOutDir,
        cashCounts: cashCounts.length,
        invariantIssues: invariants.issues.length,
      },
      null,
      2,
    ),
  );
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
