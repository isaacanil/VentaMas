/*
  Script: reconcileBusinessUsageSnapshot.js

  Purpose:
    Reconciliar usage/current de un negocio usando conteos reales de Firestore.

  Auth:
    Usa la sesión del Firebase CLI almacenada en:
      %USERPROFILE%\.config\configstore\firebase-tools.json

  Qué actualiza:
    businesses/{businessId}/usage/current

  Métricas incluidas:
    - productsTotal
    - warehousesTotal
    - clientsTotal
    - suppliersTotal
    - usersTotal
    - openCashRegisters
    - businessesTotal

  Resolución del negocio:
    - Por --businessId explícito
    - O por --userName y --businessIdPrefix
    - Por defecto intenta: userName=dev#3407 y businessIdPrefix=X

  Usage (PowerShell 7.5.4):
    node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId ventamaxpos --dry-run
    node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId ventamaxpos --write
    node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId ventamaxpos --userName dev#3407 --businessIdPrefix X --write
    node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId ventamaxpos --businessId X... --write
*/

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const FIREBASE_CONFIGSTORE_PATH = path.join(
  os.homedir(),
  '.config',
  'configstore',
  'firebase-tools.json',
);
const FIRESTORE_API_BASE = 'https://firestore.googleapis.com/v1';
const FIREBASE_TOOLS_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_TOOLS_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const SCRIPT_NAME = 'reconcileBusinessUsageSnapshot';

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const getFlagValue = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const projectId = toCleanString(getFlagValue(args, '--projectId'));
const explicitBusinessId = toCleanString(getFlagValue(args, '--businessId'));
const userName = toCleanString(getFlagValue(args, '--userName')) || 'dev#3407';
const businessIdPrefix =
  toCleanString(getFlagValue(args, '--businessIdPrefix')) || 'X';

if (!projectId) {
  console.error(
    'Usage: node functions/scripts/reconcileBusinessUsageSnapshot.js --projectId <firebase-project-id> [--businessId <id>] [--userName <name>] [--businessIdPrefix <prefix>] [--dry-run|--write]',
  );
  process.exit(1);
}

if (!shouldWrite) {
  console.log(
    `[${SCRIPT_NAME}] Running in DRY-RUN mode (pass --write to persist changes).`,
  );
}

const readFirebaseCliTokens = async () => {
  const raw = await fs.readFile(FIREBASE_CONFIGSTORE_PATH, 'utf8');
  const config = JSON.parse(raw);
  const refreshToken = toCleanString(config?.tokens?.refresh_token);
  if (!refreshToken) {
    throw new Error(`No Firebase CLI refresh token found in ${FIREBASE_CONFIGSTORE_PATH}`);
  }
  return {
    refreshToken,
    scopes:
      toCleanString(config?.tokens?.scope)?.split(/\s+/).filter(Boolean) || [
        'https://www.googleapis.com/auth/cloud-platform',
      ],
  };
};

const exchangeRefreshTokenForAccessToken = async ({
  refreshToken,
  scopes = [],
}) => {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: FIREBASE_TOOLS_CLIENT_ID,
    client_secret: FIREBASE_TOOLS_CLIENT_SECRET,
    grant_type: 'refresh_token',
    scope: scopes.join(' '),
  });

  const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OAuth refresh token exchange failed: ${response.status} ${errorBody}`,
    );
  }

  const payload = await response.json();
  const accessToken = toCleanString(payload?.access_token);
  if (!accessToken) {
    throw new Error('OAuth refresh token exchange succeeded without access_token');
  }
  return accessToken;
};

const buildDocumentName = (relativePath) =>
  `projects/${projectId}/databases/(default)/documents/${relativePath}`;

const readDocument = async (relativePath, accessToken) => {
  const response = await fetch(
    `${FIRESTORE_API_BASE}/${buildDocumentName(relativePath)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Firestore GET failed for ${relativePath}: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
};

const toFirestoreValue = (value) => {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
  }
  switch (typeof value) {
    case 'string':
      return { stringValue: value };
    case 'boolean':
      return { booleanValue: value };
    case 'number':
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    case 'object':
      return {
        mapValue: {
          fields: Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [
              key,
              toFirestoreValue(nestedValue),
            ]),
          ),
        },
      };
    default:
      throw new Error(`Unsupported Firestore value type: ${typeof value}`);
  }
};

const fromFirestoreValue = (value) => {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('mapValue' in value) {
    const fields = asRecord(value.mapValue?.fields);
    return Object.fromEntries(
      Object.entries(fields).map(([key, nestedValue]) => [
        key,
        fromFirestoreValue(nestedValue),
      ]),
    );
  }
  if ('arrayValue' in value) {
    const values = Array.isArray(value.arrayValue?.values)
      ? value.arrayValue.values
      : [];
    return values.map((item) => fromFirestoreValue(item));
  }
  return null;
};

const fromFirestoreDocument = (document) => {
  if (!document) return null;
  const fields = asRecord(document.fields);
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]),
  );
};

const patchDocument = async ({ relativePath, fields, accessToken }) => {
  const response = await fetch(
    `${FIRESTORE_API_BASE}/${buildDocumentName(relativePath)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: Object.fromEntries(
          Object.entries(fields).map(([key, value]) => [key, toFirestoreValue(value)]),
        ),
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Firestore PATCH failed for ${relativePath}: ${response.status} ${errorBody}`,
    );
  }
};

const runStructuredQuery = async ({ parentPath = '', structuredQuery, accessToken }) => {
  const parent = parentPath
    ? `projects/${projectId}/databases/(default)/documents/${parentPath}`
    : `projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(
    `${FIRESTORE_API_BASE}/${parent}:runQuery`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ structuredQuery }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Firestore runQuery failed: ${response.status} ${errorBody}`,
    );
  }

  const rows = await response.json();
  return Array.isArray(rows)
    ? rows.filter((row) => row.document).map((row) => row.document)
    : [];
};

const runAggregationCount = async ({ collectionId, parentPath, accessToken }) => {
  const parent = parentPath
    ? `projects/${projectId}/databases/(default)/documents/${parentPath}`
    : `projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(
    `${FIRESTORE_API_BASE}/${parent}:runAggregationQuery`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredAggregationQuery: {
          structuredQuery: {
            from: [{ collectionId }],
          },
          aggregations: [{ alias: 'count', count: {} }],
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Firestore runAggregationQuery failed for ${collectionId}: ${response.status} ${errorBody}`,
    );
  }

  const rows = await response.json();
  const first = Array.isArray(rows) ? rows.find((row) => row.result) : null;
  return Number(first?.result?.aggregateFields?.count?.integerValue || 0);
};

const runAggregationCountWithWhere = async ({
  collectionId,
  parentPath,
  fieldPath,
  op,
  value,
  accessToken,
}) => {
  const parent = parentPath
    ? `projects/${projectId}/databases/(default)/documents/${parentPath}`
    : `projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(
    `${FIRESTORE_API_BASE}/${parent}:runAggregationQuery`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredAggregationQuery: {
          structuredQuery: {
            from: [{ collectionId }],
            where: {
              fieldFilter: {
                field: { fieldPath },
                op,
                value: toFirestoreValue(value),
              },
            },
          },
          aggregations: [{ alias: 'count', count: {} }],
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Firestore runAggregationQuery failed for ${collectionId}/${fieldPath}: ${response.status} ${errorBody}`,
    );
  }

  const rows = await response.json();
  const first = Array.isArray(rows) ? rows.find((row) => row.result) : null;
  return Number(first?.result?.aggregateFields?.count?.integerValue || 0);
};

const findUserByName = async (normalizedName, accessToken) => {
  const queries = [
    {
      from: [{ collectionId: 'users' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'name' },
          op: 'EQUAL',
          value: { stringValue: normalizedName },
        },
      },
      limit: 10,
    },
    {
      from: [{ collectionId: 'users' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'displayName' },
          op: 'EQUAL',
          value: { stringValue: normalizedName },
        },
      },
      limit: 10,
    },
  ];

  const seen = new Map();
  for (const structuredQuery of queries) {
    const docs = await runStructuredQuery({ structuredQuery, accessToken });
    docs.forEach((document) => {
      const fullName = toCleanString(document.name);
      const uid = fullName ? fullName.split('/').slice(-1)[0] : null;
      if (!uid || seen.has(uid)) return;
      seen.set(uid, {
        uid,
        ...fromFirestoreDocument(document),
      });
    });
  }

  const matches = [...seen.values()];
  if (!matches.length) {
    throw new Error(`No se encontró usuario con name/displayName "${normalizedName}".`);
  }
  if (matches.length > 1) {
    throw new Error(
      `Se encontraron múltiples usuarios para "${normalizedName}": ${matches.map((item) => item.uid).join(', ')}`,
    );
  }
  return matches[0];
};

const listBusinessIdsFromBillingLinks = async (ownerUid, accessToken) => {
  const docs = await runStructuredQuery({
    parentPath: `billingAccounts/acct_${ownerUid}`,
    structuredQuery: {
      from: [{ collectionId: 'businessLinks' }],
    },
    accessToken,
  });

  return docs
    .map((document) => toCleanString(document.name)?.split('/').slice(-1)[0] || null)
    .filter(Boolean);
};

const matchesOwnership = (businessData, ownerUid) => {
  const root = asRecord(businessData);
  const businessNode = asRecord(root.business);

  return [
    root.ownerUid,
    root.billingContactUid,
    businessNode.ownerUid,
    businessNode.billingContactUid,
  ].some((value) => toCleanString(value) === ownerUid);
};

const scanBusinessesForOwner = async (ownerUid, accessToken) => {
  const docs = await runStructuredQuery({
    structuredQuery: {
      from: [{ collectionId: 'businesses' }],
    },
    accessToken,
  });

  return docs
    .map((document) => ({
      id: toCleanString(document.name)?.split('/').slice(-1)[0] || null,
      data: fromFirestoreDocument(document),
    }))
    .filter((entry) => entry.id && matchesOwnership(entry.data, ownerUid))
    .map((entry) => entry.id);
};

const resolveBusinessId = async (accessToken) => {
  if (explicitBusinessId) {
    return {
      businessId: explicitBusinessId,
      resolution: 'explicit-businessId',
      ownerUid: null,
      user: null,
      candidates: [explicitBusinessId],
    };
  }

  const user = await findUserByName(userName, accessToken);
  const ownerUid = user.uid;

  let candidates = await listBusinessIdsFromBillingLinks(ownerUid, accessToken);
  if (!candidates.length) {
    candidates = await scanBusinessesForOwner(ownerUid, accessToken);
  }

  const filtered = candidates.filter((businessId) =>
    businessIdPrefix ? businessId.startsWith(businessIdPrefix) : true,
  );

  if (!filtered.length) {
    throw new Error(
      `No se encontró negocio para ${userName} con prefijo ${businessIdPrefix}. Candidatos vistos: ${candidates.join(', ') || 'ninguno'}`,
    );
  }

  if (filtered.length > 1) {
    throw new Error(
      `Se encontraron múltiples negocios para ${userName} con prefijo ${businessIdPrefix}: ${filtered.join(', ')}`,
    );
  }

  return {
    businessId: filtered[0],
    resolution: 'userName+businessIdPrefix',
    ownerUid,
    user,
    candidates: filtered,
  };
};

const buildUsageSnapshot = async ({ businessId, ownerUid, accessToken }) => {
  const parentPath = `businesses/${businessId}`;
  const productsTotal = await runAggregationCount({
    parentPath,
    collectionId: 'products',
    accessToken,
  });
  const warehousesTotal = await runAggregationCount({
    parentPath,
    collectionId: 'warehouses',
    accessToken,
  });
  const clientsTotal = await runAggregationCount({
    parentPath,
    collectionId: 'clients',
    accessToken,
  });
  const suppliersTotal = await runAggregationCount({
    parentPath,
    collectionId: 'providers',
    accessToken,
  });
  const usersTotal = await runAggregationCount({
    parentPath,
    collectionId: 'members',
    accessToken,
  });
  const openCashRegistersOpen = await runAggregationCountWithWhere({
    parentPath,
    collectionId: 'cashCounts',
    fieldPath: 'cashCount.state',
    op: 'EQUAL',
    value: 'open',
    accessToken,
  });
  const openCashRegistersClosing = await runAggregationCountWithWhere({
    parentPath,
    collectionId: 'cashCounts',
    fieldPath: 'cashCount.state',
    op: 'EQUAL',
    value: 'closing',
    accessToken,
  });
  const businessesTotal = ownerUid
    ? await runAggregationCount({
        parentPath: `billingAccounts/acct_${ownerUid}`,
        collectionId: 'businessLinks',
        accessToken,
      })
    : 0;

  return {
    businessId,
    productsTotal,
    warehousesTotal,
    clientsTotal,
    suppliersTotal,
    usersTotal,
    openCashRegisters: openCashRegistersOpen + openCashRegistersClosing,
    businessesTotal,
  };
};

const run = async () => {
  const tokens = await readFirebaseCliTokens();
  const accessToken = await exchangeRefreshTokenForAccessToken(tokens);
  const resolution = await resolveBusinessId(accessToken);
  const usageRelativePath = `businesses/${resolution.businessId}/usage/current`;

  const [usageDoc, nextUsage] = await Promise.all([
    readDocument(usageRelativePath, accessToken),
    buildUsageSnapshot({
      businessId: resolution.businessId,
      ownerUid: resolution.ownerUid,
      accessToken,
    }),
  ]);

  const currentUsage = usageDoc ? fromFirestoreDocument(usageDoc) : {};
  const payload = {
    ...currentUsage,
    ...nextUsage,
    reconciledBy: SCRIPT_NAME,
    reconciledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (shouldWrite) {
    await patchDocument({
      relativePath: usageRelativePath,
      fields: payload,
      accessToken,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: shouldWrite ? 'write' : 'dry-run',
        projectId,
        resolution,
        currentUsage,
        nextUsage,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error(`[${SCRIPT_NAME}] failed:`, error);
  process.exitCode = 1;
});
