/*
  Script: seedBillingPlanCatalog.js

  Purpose:
    Seed builtin plans into Firestore before removing runtime hardcoded fallbacks.

  Writes:
    billingPlanCatalog/{planCode}
    billingPlanCatalog/{planCode}/versions/{versionId}

  Auth:
    Uses the Firebase CLI logged-in session stored in:
      %USERPROFILE%\.config\configstore\firebase-tools.json

  Usage (PowerShell 7.5.4):
    node functions/scripts/seedBillingPlanCatalog.js --projectId ventamaxpos --dry-run
    node functions/scripts/seedBillingPlanCatalog.js --projectId ventamaxpos --write
*/

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  BILLING_PLAN_BOOTSTRAP_DEFAULTS,
  BUILTIN_PLAN_CODES,
} from '../src/app/versions/v2/billing/config/planCatalogBootstrapDefaults.js';

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

const getFlagValue = (args, name) => {
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) {
    return withEq.slice(name.length + 1) || null;
  }
  const idx = args.findIndex((item) => item === name);
  if (idx === -1) return null;
  return args[idx + 1] || null;
};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFirestoreValue = (value) => {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
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
      if (!Number.isFinite(value)) {
        throw new Error(`Numeric value must be finite. Received: ${value}`);
      }
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

const buildDocumentName = (projectId, relativePath) =>
  `${FIRESTORE_API_BASE}/projects/${projectId}/databases/(default)/documents/${relativePath}`;

const patchDocument = async ({
  projectId,
  relativePath,
  fields,
  accessToken,
}) => {
  const response = await fetch(buildDocumentName(projectId, relativePath), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: toFirestoreValue(fields).mapValue.fields }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Firestore PATCH failed for ${relativePath}: ${response.status} ${errorBody}`,
    );
  }
};

const buildPlanDocument = ({ planCode, versionId, displayName, nowIso }) => ({
  planCode,
  displayName,
  catalogStatus: 'active',
  isSystemBuiltin: true,
  activeVersionId: versionId,
  latestVersionId: versionId,
  createdAt: nowIso,
  updatedAt: nowIso,
  bootstrapSource: 'seedBillingPlanCatalog',
});

const buildVersionDocument = ({ planCode, versionId, version, nowIso }) => ({
  planCode,
  version: versionId,
  displayName: version.displayName,
  state: toCleanString(version.state) || 'active',
  effectiveAt: version.effectiveAt,
  billingCycle: version.billingCycle || 'monthly',
  priceMonthly: Number(version.priceMonthly || 0),
  currency: version.currency || 'DOP',
  noticeWindowDays: Number(version.noticeWindowDays || 30),
  limits: version.limits || {},
  modules: version.modules || {},
  addons: version.addons || {},
  features: version.features || {},
  moduleAccess: version.moduleAccess || {},
  isSystemBuiltin: true,
  createdAt: nowIso,
  updatedAt: nowIso,
  bootstrapSource: 'seedBillingPlanCatalog',
});

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const projectId = toCleanString(getFlagValue(args, '--projectId')) || 'ventamaxpos';

if (args.includes('--help') || args.includes('-h')) {
  console.log(
    'Usage: node functions/scripts/seedBillingPlanCatalog.js --projectId <firebase-project-id> [--dry-run|--write]',
  );
  process.exit(0);
}

const run = async () => {
  const nowIso = new Date().toISOString();
  const plans = BUILTIN_PLAN_CODES.map((planCode) => {
    const version = BILLING_PLAN_BOOTSTRAP_DEFAULTS[planCode];
    if (!version) {
      throw new Error(`Missing bootstrap definition for ${planCode}`);
    }
    const versionId = toCleanString(version.version);
    if (!versionId) {
      throw new Error(`Missing version id for ${planCode}`);
    }
    return {
      planCode,
      versionId,
      planDocument: buildPlanDocument({
        planCode,
        versionId,
        displayName: version.displayName,
        nowIso,
      }),
      versionDocument: buildVersionDocument({
        planCode,
        versionId,
        version,
        nowIso,
      }),
    };
  });

  if (!shouldWrite) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          projectId,
          plans: plans.map((plan) => ({
            planCode: plan.planCode,
            versionId: plan.versionId,
            isSystemBuiltin: true,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  const { refreshToken, scopes } = await readFirebaseCliTokens();
  const accessToken = await exchangeRefreshTokenForAccessToken({
    refreshToken,
    scopes,
  });

  for (const plan of plans) {
    await patchDocument({
      projectId,
      relativePath: `billingPlanCatalog/${plan.planCode}`,
      fields: plan.planDocument,
      accessToken,
    });
    await patchDocument({
      projectId,
      relativePath: `billingPlanCatalog/${plan.planCode}/versions/${plan.versionId}`,
      fields: plan.versionDocument,
      accessToken,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'write',
        projectId,
        seededPlans: plans.map((plan) => ({
          planCode: plan.planCode,
          versionId: plan.versionId,
        })),
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error('[seedBillingPlanCatalog] failed:', error);
  process.exitCode = 1;
});
