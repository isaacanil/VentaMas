#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';

import {
  DEFAULT_DOMAINS,
  DEFAULT_EXPORT_OPTIONS,
  collectionPathFromDocPath,
  createDocAccumulator,
  ensureDirectoryForFile,
  exitWithUsage,
  extractInvoiceClientId,
  extractInvoiceNumber,
  extractInvoiceProductIds,
  filterCollectionDocs,
  formatSummaryLines,
  getCollectionDocs,
  getDocData,
  getOrInitExportDb,
  parseCliArgs,
  parseIntegerArg,
  parseListArg,
  pickLatestDocs,
  resolveDefaultExportPath,
  sanitizeDocForExport,
  serializeForExport,
  summarizeDocsByCollection,
  uniqueStrings,
  writeJsonFile,
} from './business-slice/utils.mjs';

const USAGE = `
Uso:
  node .\\tools\\export-business-slice.mjs --business-id=<id> [opciones]

Opciones:
  --business-id=<id>              Requerido.
  --username=<dev#3407>           Usuario raiz a incluir.
  --uid=<uid>                     UID alterno del usuario raiz.
  --domains=identity,sales,...    Dominios a exportar. Default: ${DEFAULT_DOMAINS.join(',')}
  --invoice-numbers=953,954       Numeros de factura canonica a incluir.
  --invoice-ids=id1,id2           IDs de factura canonica a incluir.
  --client-ids=id1,id2            Clientes adicionales a incluir.
  --product-ids=id1,id2           Productos adicionales a incluir.
  --cash-count-ids=id1,id2        Cierres/cajas adicionales a incluir.
  --out=<ruta-json>               Archivo de salida. Default: tmp\\emulator-seeds\\<business>\\business-slice.json
  --project-id=<firebase-project> Proyecto Firebase. Default: ADC/.firebaserc.
  --sanitize=auth-only|none       Default: ${DEFAULT_EXPORT_OPTIONS.sanitize}
  --local-password=<clave>        Password local para users/*. Default: ${DEFAULT_EXPORT_OPTIONS.localPassword}
  --invoice-limit=<n>             Default: ${DEFAULT_EXPORT_OPTIONS.invoiceLimit}
  --cash-count-limit=<n>          Default: ${DEFAULT_EXPORT_OPTIONS.cashCountLimit}
  --receivable-limit=<n>          Default: ${DEFAULT_EXPORT_OPTIONS.receivableLimit}
  --product-limit=<n>             Default: ${DEFAULT_EXPORT_OPTIONS.productLimit}
  --movement-limit=<n>            Default: ${DEFAULT_EXPORT_OPTIONS.movementLimit}
  --tax-report-limit=<n>          Default: ${DEFAULT_EXPORT_OPTIONS.taxReportLimit}
  --purchase-limit=<n>            Default: ${DEFAULT_EXPORT_OPTIONS.purchaseLimit}
  --expense-limit=<n>             Default: ${DEFAULT_EXPORT_OPTIONS.expenseLimit}
  --credit-note-limit=<n>         Default: ${DEFAULT_EXPORT_OPTIONS.creditNoteLimit}
  --help                          Muestra esta ayuda.
`;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const collectCandidateIds = (data, fields) => {
  const result = new Set();
  const source = isRecord(data) ? data : {};
  for (const field of fields) {
    const value = source[field];
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) result.add(normalized);
  }
  return result;
};

const addCollectionEntries = async ({
  db,
  docs,
  domain,
  collectionPath,
  predicate = () => true,
}) => {
  const entries = await filterCollectionDocs(db, collectionPath, predicate);
  for (const entry of entries) {
    docs.add(entry.path, entry.data, domain);
  }
  return entries;
};

const findUserDoc = async ({ db, uid, username }) => {
  if (uid) {
    const byUid = await getDocData(db, `users/${uid}`);
    if (byUid) return byUid;
  }

  if (!username) return null;

  const exact = await db.collection('users').where('name', '==', username).limit(1).get();
  if (!exact.empty) {
    const doc = exact.docs[0];
    return { id: doc.id, path: doc.ref.path, data: doc.data() };
  }

  const legacy = await db
    .collection('users')
    .where('user.name', '==', username)
    .limit(1)
    .get();

  if (!legacy.empty) {
    const doc = legacy.docs[0];
    return { id: doc.id, path: doc.ref.path, data: doc.data() };
  }

  return null;
};

const selectInvoices = async ({ db, businessId, filters, invoiceLimit }) => {
  const invoicePath = `businesses/${businessId}/invoices`;
  const invoices = await getCollectionDocs(db, invoicePath);
  const byId = new Set(uniqueStrings(filters.invoiceIds));
  const byNumber = new Set(uniqueStrings(filters.invoiceNumbers));

  const targeted = invoices.filter((entry) => {
    if (byId.size > 0 && byId.has(entry.id)) return true;
    const number = extractInvoiceNumber(entry.data);
    return byNumber.size > 0 && number && byNumber.has(number);
  });

  if (targeted.length > 0) return targeted;
  return pickLatestDocs(invoices, invoiceLimit, ['date']);
};

const selectCashCounts = async ({ db, businessId, cashCountIds, cashCountLimit }) => {
  const collectionPath = `businesses/${businessId}/cashCounts`;
  const entries = await getCollectionDocs(db, collectionPath);
  const targetedIds = new Set(uniqueStrings(cashCountIds));
  if (targetedIds.size > 0) {
    return entries.filter((entry) => targetedIds.has(entry.id));
  }
  return pickLatestDocs(entries, cashCountLimit, ['updatedAt']);
};

const collectReceivableIdsFromDoc = (data) => {
  const result = new Set();
  const root = isRecord(data) ? data : {};
  const nested = isRecord(root.data) ? root.data : {};
  for (const field of ['id', 'arId', 'accountReceivableId', 'accountsReceivableId']) {
    if (root[field]) result.add(String(root[field]).trim());
    if (nested[field]) result.add(String(nested[field]).trim());
  }
  return result;
};

const matchesAnyId = (data, fields, ids) => {
  if (ids.size === 0) return false;
  const source = isRecord(data) ? data : {};
  const nested = isRecord(source.data) ? source.data : {};
  for (const field of fields) {
    const candidates = [source[field], nested[field]];
    for (const value of candidates) {
      if (value === null || value === undefined) continue;
      const normalized = String(value).trim();
      if (normalized && ids.has(normalized)) return true;
    }
  }
  return false;
};

const exportIdentityDomain = async ({
  db,
  docs,
  businessId,
  domain,
  userDoc,
  filters,
}) => {
  console.log('[export-business-slice] identity:start');
  const businessDoc = await getDocData(db, `businesses/${businessId}`);
  if (!businessDoc) {
    throw new Error(`No se encontro businesses/${businessId}.`);
  }
  docs.add(businessDoc.path, businessDoc.data, domain);

  const members = await getCollectionDocs(db, `businesses/${businessId}/members`);
  members.forEach((entry) => docs.add(entry.path, entry.data, domain));

  const userPermissions = await getCollectionDocs(
    db,
    `businesses/${businessId}/userPermissions`,
  );
  userPermissions.forEach((entry) => docs.add(entry.path, entry.data, domain));

  const settings = await getCollectionDocs(db, `businesses/${businessId}/settings`);
  settings.forEach((entry) => docs.add(entry.path, entry.data, domain));

  const taxReceipts = await getCollectionDocs(db, `businesses/${businessId}/taxReceipts`);
  taxReceipts.forEach((entry) => docs.add(entry.path, entry.data, domain));

  const counters = await getCollectionDocs(db, `businesses/${businessId}/counters`);
  counters.forEach((entry) => docs.add(entry.path, entry.data, domain));

  const memberUserIds = new Set(members.map((entry) => entry.id));
  if (userDoc?.id) memberUserIds.add(userDoc.id);
  for (const extraUserId of uniqueStrings(filters.extraUserIds || [])) {
    memberUserIds.add(extraUserId);
  }

  for (const userId of memberUserIds) {
    const userRootDoc = await getDocData(db, `users/${userId}`);
    if (userRootDoc) {
      docs.add(userRootDoc.path, userRootDoc.data, domain);
    }
  }

  return {
    businessDoc,
    memberUserIds,
  };
};

const exportSalesDomain = async ({
  db,
  docs,
  businessId,
  domain,
  options,
  filters,
  state,
}) => {
  console.log('[export-business-slice] sales:start');
  const selectedInvoices = await selectInvoices({
    db,
    businessId,
    filters,
    invoiceLimit: options.invoiceLimit,
  });

  for (const invoice of selectedInvoices) {
    docs.add(invoice.path, invoice.data, domain);
    state.invoiceIds.add(invoice.id);

    const invoiceNumber = extractInvoiceNumber(invoice.data);
    if (invoiceNumber) state.invoiceNumbers.add(invoiceNumber);

    const clientId = extractInvoiceClientId(invoice.data);
    if (clientId) state.clientIds.add(clientId);

    for (const productId of extractInvoiceProductIds(invoice.data)) {
      state.productIds.add(productId);
    }
  }

  for (const invoiceId of state.invoiceIds) {
    const v2Doc = await getDocData(db, `businesses/${businessId}/invoicesV2/${invoiceId}`);
    if (v2Doc) {
      docs.add(v2Doc.path, v2Doc.data, domain);
    }

    const outboxEntries = await getCollectionDocs(
      db,
      `businesses/${businessId}/invoicesV2/${invoiceId}/outbox`,
    );
    outboxEntries.forEach((entry) => docs.add(entry.path, entry.data, domain));
  }

  const selectedCashCounts = await selectCashCounts({
    db,
    businessId,
    cashCountIds: filters.cashCountIds,
    cashCountLimit: options.cashCountLimit,
  });
  selectedCashCounts.forEach((entry) => docs.add(entry.path, entry.data, domain));

  return {
    selectedInvoices,
    selectedCashCounts,
  };
};

const exportInventoryDomain = async ({
  db,
  docs,
  businessId,
  domain,
  options,
  state,
}) => {
  console.log('[export-business-slice] inventory:start');
  const catalogCollections = [
    'categories',
    'productBrands',
    'activeIngredients',
    'providers',
    'expensesCategories',
    'warehouses',
    'shelves',
    'rows',
    'segments',
    'warehouseStructure',
  ];

  for (const collectionName of catalogCollections) {
    const entries = await getCollectionDocs(db, `businesses/${businessId}/${collectionName}`);
    entries.forEach((entry) => docs.add(entry.path, entry.data, domain));
  }

  const products = await getCollectionDocs(db, `businesses/${businessId}/products`);
  const selectedProductIds = new Set(uniqueStrings([...state.productIds]));

  let selectedProducts = products.filter((entry) => selectedProductIds.has(entry.id));
  if (selectedProducts.length === 0) {
    selectedProducts = pickLatestDocs(products, options.productLimit, ['updatedAt']);
  }

  for (const entry of selectedProducts) {
    docs.add(entry.path, entry.data, domain);
    state.productIds.add(entry.id);
  }

  const productStocks = await filterCollectionDocs(
    db,
    `businesses/${businessId}/productsStock`,
    (data) =>
      matchesAnyId(data, ['productId'], state.productIds) &&
      data?.isDeleted !== true,
  );
  productStocks.forEach((entry) => docs.add(entry.path, entry.data, domain));

  const batchIds = new Set();
  for (const entry of productStocks) {
    const ids = collectCandidateIds(entry.data, ['batchId']);
    ids.forEach((id) => batchIds.add(id));
  }

  const batches = await filterCollectionDocs(
    db,
    `businesses/${businessId}/batches`,
    (data, entry) => batchIds.has(entry.id) || matchesAnyId(data, ['productId'], state.productIds),
  );
  batches.forEach((entry) => docs.add(entry.path, entry.data, domain));

  const movements = await filterCollectionDocs(
    db,
    `businesses/${businessId}/movements`,
    (data) =>
      matchesAnyId(data, ['productId'], state.productIds) ||
      matchesAnyId(data, ['batchId'], batchIds),
  );
  pickLatestDocs(movements, options.movementLimit, ['createdAt']).forEach((entry) =>
    docs.add(entry.path, entry.data, domain),
  );
};

const exportReceivablesDomain = async ({
  db,
  docs,
  businessId,
  domain,
  options,
  state,
}) => {
  console.log('[export-business-slice] receivables:start');
  const accountsReceivable = await filterCollectionDocs(
    db,
    `businesses/${businessId}/accountsReceivable`,
    (data) =>
      matchesAnyId(data, ['invoiceId', 'invoiceID'], state.invoiceIds) ||
      matchesAnyId(data, ['clientId'], state.clientIds),
  );

  const selectedAr =
    accountsReceivable.length > 0
      ? accountsReceivable
      : pickLatestDocs(
          await getCollectionDocs(db, `businesses/${businessId}/accountsReceivable`),
          options.receivableLimit,
          ['updatedAt'],
        );

  selectedAr.forEach((entry) => {
    docs.add(entry.path, entry.data, domain);
    collectReceivableIdsFromDoc(entry.data).forEach((id) => state.arIds.add(id));
    collectCandidateIds(entry.data, ['clientId']).forEach((id) => state.clientIds.add(id));
  });

  const relatedCollectionConfigs = [
    {
      name: 'accountsReceivablePayments',
      fields: ['accountReceivableId', 'accountsReceivableId', 'arId', 'invoiceId', 'clientId'],
    },
    {
      name: 'accountsReceivableInstallments',
      fields: ['accountReceivableId', 'accountsReceivableId', 'arId', 'invoiceId', 'clientId'],
    },
    {
      name: 'accountsReceivableInstallmentPayments',
      fields: ['accountReceivableId', 'accountsReceivableId', 'arId', 'invoiceId', 'clientId'],
    },
    {
      name: 'accountsReceivablePaymentReceipt',
      fields: ['accountReceivableId', 'accountsReceivableId', 'arId', 'invoiceId', 'clientId'],
    },
  ];

  for (const config of relatedCollectionConfigs) {
    const entries = await filterCollectionDocs(
      db,
      `businesses/${businessId}/${config.name}`,
      (data) =>
        matchesAnyId(data, config.fields, state.arIds) ||
        matchesAnyId(data, config.fields, state.invoiceIds) ||
        matchesAnyId(data, config.fields, state.clientIds),
    );
    entries.forEach((entry) => docs.add(entry.path, entry.data, domain));
  }

  for (const clientId of state.clientIds) {
    const creditLimitDoc = await getDocData(
      db,
      `businesses/${businessId}/creditLimit/${clientId}`,
    );
    if (creditLimitDoc) {
      docs.add(creditLimitDoc.path, creditLimitDoc.data, domain);
    }
  }
};

const exportFiscalDomain = async ({
  db,
  docs,
  businessId,
  domain,
  options,
  state,
}) => {
  console.log('[export-business-slice] fiscal:start');
  const latestTaxReportRuns = pickLatestDocs(
    await getCollectionDocs(db, `businesses/${businessId}/taxReportRuns`),
    options.taxReportLimit,
    ['updatedAt'],
  );
  latestTaxReportRuns.forEach((entry) => docs.add(entry.path, entry.data, domain));

  const fiscalConfigs = [
    {
      collectionName: 'ncfUsage',
      fields: ['invoiceId', 'sourceId', 'documentId'],
      limit: options.invoiceLimit,
    },
    {
      collectionName: 'ncfLedger',
      fields: ['invoiceId', 'sourceId', 'documentId'],
      limit: options.invoiceLimit,
    },
    {
      collectionName: 'creditNotes',
      fields: ['invoiceId', 'clientId'],
      limit: options.creditNoteLimit,
    },
    {
      collectionName: 'purchases',
      fields: ['providerId'],
      limit: options.purchaseLimit,
    },
    {
      collectionName: 'expenses',
      fields: ['providerId'],
      limit: options.expenseLimit,
    },
  ];

  for (const config of fiscalConfigs) {
    const allEntries = await getCollectionDocs(
      db,
      `businesses/${businessId}/${config.collectionName}`,
    );
    const filtered = allEntries.filter(
      (entry) =>
        matchesAnyId(entry.data, config.fields, state.invoiceIds) ||
        matchesAnyId(entry.data, config.fields, state.clientIds),
    );
    const selected = filtered.length > 0 ? filtered : pickLatestDocs(allEntries, config.limit);
    selected.forEach((entry) => docs.add(entry.path, entry.data, domain));
  }
};

const exportClients = async ({ db, docs, businessId, state, domain }) => {
  if (state.clientIds.size === 0) return;
  console.log('[export-business-slice] clients:hydrate');

  const clients = await filterCollectionDocs(
    db,
    `businesses/${businessId}/clients`,
    (_data, entry) => state.clientIds.has(entry.id),
  );
  clients.forEach((entry) => docs.add(entry.path, entry.data, domain));
};

const buildState = (filters) => ({
  invoiceIds: new Set(uniqueStrings(filters.invoiceIds)),
  invoiceNumbers: new Set(uniqueStrings(filters.invoiceNumbers)),
  clientIds: new Set(uniqueStrings(filters.clientIds)),
  productIds: new Set(uniqueStrings(filters.productIds)),
  arIds: new Set(),
});

const main = async () => {
  const { flags } = parseCliArgs(process.argv);
  if (flags.help) {
    console.log(USAGE.trim());
    return;
  }

  const businessId = toCleanString(flags['business-id']);
  if (!businessId) {
    exitWithUsage('Falta --business-id.', USAGE);
  }

  const domains = uniqueStrings(parseListArg(flags.domains));
  const selectedDomains = domains.length > 0 ? domains : DEFAULT_DOMAINS;
  const invalidDomains = selectedDomains.filter((domain) => !DEFAULT_DOMAINS.includes(domain));
  if (invalidDomains.length > 0) {
    exitWithUsage(`Dominios invalidos: ${invalidDomains.join(', ')}`, USAGE);
  }

  const options = {
    invoiceLimit: parseIntegerArg(flags['invoice-limit'], DEFAULT_EXPORT_OPTIONS.invoiceLimit),
    cashCountLimit: parseIntegerArg(
      flags['cash-count-limit'],
      DEFAULT_EXPORT_OPTIONS.cashCountLimit,
    ),
    receivableLimit: parseIntegerArg(
      flags['receivable-limit'],
      DEFAULT_EXPORT_OPTIONS.receivableLimit,
    ),
    productLimit: parseIntegerArg(flags['product-limit'], DEFAULT_EXPORT_OPTIONS.productLimit),
    movementLimit: parseIntegerArg(flags['movement-limit'], DEFAULT_EXPORT_OPTIONS.movementLimit),
    taxReportLimit: parseIntegerArg(
      flags['tax-report-limit'],
      DEFAULT_EXPORT_OPTIONS.taxReportLimit,
    ),
    purchaseLimit: parseIntegerArg(flags['purchase-limit'], DEFAULT_EXPORT_OPTIONS.purchaseLimit),
    expenseLimit: parseIntegerArg(flags['expense-limit'], DEFAULT_EXPORT_OPTIONS.expenseLimit),
    creditNoteLimit: parseIntegerArg(
      flags['credit-note-limit'],
      DEFAULT_EXPORT_OPTIONS.creditNoteLimit,
    ),
    sanitize: toCleanString(flags.sanitize) || DEFAULT_EXPORT_OPTIONS.sanitize,
    localPassword:
      toCleanString(flags['local-password']) || DEFAULT_EXPORT_OPTIONS.localPassword,
  };

  const filters = {
    username: toCleanString(flags.username),
    uid: toCleanString(flags.uid),
    invoiceNumbers: parseListArg(flags['invoice-numbers']),
    invoiceIds: parseListArg(flags['invoice-ids']),
    clientIds: parseListArg(flags['client-ids']),
    productIds: parseListArg(flags['product-ids']),
    cashCountIds: parseListArg(flags['cash-count-ids']),
    extraUserIds: parseListArg(flags['user-ids']),
  };

  const outputPath = path.resolve(
    process.cwd(),
    toCleanString(flags.out) || resolveDefaultExportPath(businessId),
  );

  const resolvedProjectId = toCleanString(flags['project-id']) || null;
  const db = getOrInitExportDb({
    projectId: resolvedProjectId || undefined,
  });

  const userDoc = await findUserDoc({
    db,
    uid: filters.uid,
    username: filters.username,
  });

  const docs = createDocAccumulator();
  const state = buildState(filters);

  console.log(
    `[export-business-slice] start business=${businessId} domains=${selectedDomains.join(',')}`,
  );

  if (selectedDomains.includes('identity')) {
    await exportIdentityDomain({
      db,
      docs,
      businessId,
      domain: 'identity',
      userDoc,
      filters,
    });
  } else {
    const businessDoc = await getDocData(db, `businesses/${businessId}`);
    if (!businessDoc) {
      throw new Error(`No se encontro businesses/${businessId}.`);
    }
    docs.add(businessDoc.path, businessDoc.data, 'identity');
  }

  if (selectedDomains.includes('sales')) {
    await exportSalesDomain({
      db,
      docs,
      businessId,
      domain: 'sales',
      options,
      filters,
      state,
    });
  }

  if (selectedDomains.includes('inventory')) {
    await exportInventoryDomain({
      db,
      docs,
      businessId,
      domain: 'inventory',
      options,
      state,
    });
  }

  if (selectedDomains.includes('receivables')) {
    await exportReceivablesDomain({
      db,
      docs,
      businessId,
      domain: 'receivables',
      options,
      state,
    });
  }

  if (selectedDomains.includes('fiscal')) {
    await exportFiscalDomain({
      db,
      docs,
      businessId,
      domain: 'fiscal',
      options,
      state,
    });
  }

  await exportClients({
    db,
    docs,
    businessId,
    state,
    domain: 'sales',
  });

  const sanitizedDocs = [];
  console.log('[export-business-slice] sanitize:start');
  for (const entry of docs.toArray()) {
    const sanitizedData = await sanitizeDocForExport({
      docPath: entry.path,
      data: entry.data,
      sanitize: options.sanitize,
      localPassword: options.localPassword,
    });

    sanitizedDocs.push({
      path: entry.path,
      collectionPath: collectionPathFromDocPath(entry.path),
      domain: entry.domain,
      data: serializeForExport(sanitizedData),
    });
  }

  const summary = summarizeDocsByCollection(sanitizedDocs);
  console.log('[export-business-slice] write:start');
  const manifest = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projectId: resolvedProjectId,
    businessId,
    domains: selectedDomains,
    filters: {
      ...filters,
      username: filters.username || null,
      uid: filters.uid || null,
    },
    localAuth: userDoc
      ? {
          uid: userDoc.id,
          username:
            toCleanString(userDoc.data?.name) ||
            toCleanString(userDoc.data?.user?.name) ||
            filters.username ||
            null,
          password: options.localPassword,
        }
      : null,
    stats: {
      totalDocs: sanitizedDocs.length,
      byCollection: summary,
    },
    docs: sanitizedDocs.sort((left, right) => left.path.localeCompare(right.path)),
  };

  await ensureDirectoryForFile(outputPath);
  await writeJsonFile(outputPath, manifest);

  console.log(`Slice exportado: ${outputPath}`);
  console.log(`Total docs: ${manifest.stats.totalDocs}`);
  for (const line of formatSummaryLines(summary)) {
    console.log(`- ${line}`);
  }
};

main().catch((error) => {
  console.error('[export-business-slice] failed');
  console.error(error);
  process.exitCode = 1;
});
