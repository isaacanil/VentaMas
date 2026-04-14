/*
  Script: seedBillingPlanCatalog.js

  Purpose:
    Seed builtin plans into Firestore before removing runtime hardcoded fallbacks.

  Writes:
    billingPlanCatalog/{planCode}
    billingPlanCatalog/{planCode}/versions/{versionId}

  Auth:
    Uses Application Default Credentials o una service account local.

  Usage (PowerShell 7.5.4):
    node functions/scripts/seedBillingPlanCatalog.js --projectId ventamaxpos --dry-run
    node functions/scripts/seedBillingPlanCatalog.js --projectId ventamaxpos --write
    node functions/scripts/seedBillingPlanCatalog.js --projectId ventamaxpos --service-account C:\path\key.json --write
*/

import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';

import {
  BILLING_PLAN_BOOTSTRAP_DEFAULTS,
  BUILTIN_PLAN_CODES,
} from '../src/app/versions/v2/billing/config/planCatalogBootstrapDefaults.js';

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

const loadServiceAccountCredential = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return admin.credential.cert(JSON.parse(raw));
};

const initializeAdminApp = ({ projectId, serviceAccountPath }) => {
  if (admin.apps.length) return admin.app();

  const options = {
    projectId,
    credential: serviceAccountPath
      ? loadServiceAccountCredential(serviceAccountPath)
      : admin.credential.applicationDefault(),
  };

  return admin.initializeApp(options);
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
const serviceAccountPath =
  toCleanString(getFlagValue(args, '--service-account')) ||
  toCleanString(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (args.includes('--help') || args.includes('-h')) {
  console.log(
    'Usage: node functions/scripts/seedBillingPlanCatalog.js --projectId <firebase-project-id> [--service-account <path>] [--dry-run|--write]',
  );
  process.exit(0);
}

const app = initializeAdminApp({ projectId, serviceAccountPath });
const db = admin.firestore();
const resolvedProjectId =
  toCleanString(app.options.projectId) ||
  toCleanString(process.env.GOOGLE_CLOUD_PROJECT) ||
  toCleanString(process.env.GCLOUD_PROJECT) ||
  projectId;

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
          projectId: resolvedProjectId,
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

  for (const plan of plans) {
    // Keep writes idempotent so reruns are safe across environments.
    // eslint-disable-next-line no-await-in-loop
    await db.doc(`billingPlanCatalog/${plan.planCode}`).set(plan.planDocument, {
      merge: true,
    });
    // eslint-disable-next-line no-await-in-loop
    await db
      .doc(`billingPlanCatalog/${plan.planCode}/versions/${plan.versionId}`)
      .set(plan.versionDocument, { merge: true });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'write',
        projectId: resolvedProjectId,
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
