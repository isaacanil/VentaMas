import { normalizeSubscriptionEntitlements } from './subscriptionEntitlements';
import type { UnknownRecord } from './subscription.types';
import {
  asRecord,
  normalizeNoticeWindowDays,
  toCleanString,
  toFiniteNumber,
  toMillis,
} from './subscription.utils';

export interface VersionEditorSeed {
  planCode: string;
  displayName: string;
  priceMonthly: number;
  noticeWindowDays: number;
  versionId: string;
  effectiveAt: string;
  limitsJson: string;
  modulesJson: string;
  addonsJson: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');

export const toIsoAtLocalMidnight = (value: Date): string =>
  new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    0,
    0,
    0,
    0,
  ).toISOString();

const sanitizePlanCodeSegment = (value: string | null): string =>
  (value || 'plan').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'plan';

const resolveVersionSource = (plan: UnknownRecord | null): UnknownRecord => {
  const rootPlan = asRecord(plan);
  if (rootPlan.currentVersion && typeof rootPlan.currentVersion === 'object') {
    return {
      ...asRecord(rootPlan.currentVersion),
      planCode: toCleanString(rootPlan.planCode) || asRecord(rootPlan.currentVersion).planCode,
      displayName:
        toCleanString(rootPlan.displayName) || asRecord(rootPlan.currentVersion).displayName,
    };
  }
  return rootPlan;
};

const extractVersionSequence = (versionId: string | null): number | null => {
  if (!versionId) return null;
  const match = /(?:^|[^a-z0-9])v(\d+)(?:[^a-z0-9]|$)/i.exec(versionId);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveDateSegment = (effectiveAt: unknown): string => {
  const millis = toMillis(effectiveAt) || Date.now();
  const date = new Date(millis);
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
};

export const findCatalogPlanByCode = (
  plans: Array<UnknownRecord>,
  planCode: string,
): UnknownRecord | null =>
  plans
    .map((item) => asRecord(item))
    .find((item) => toCleanString(item.planCode) === toCleanString(planCode)) || null;

export const buildSuggestedEffectiveAt = (
  noticeWindowDays: number,
  nowMillis = Date.now(),
): string => {
  if (noticeWindowDays === 0) return '';
  const baseDate = new Date(nowMillis);
  const targetDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + Math.max(1, Number.isFinite(noticeWindowDays) ? noticeWindowDays : 30),
    0,
    0,
    0,
    0,
  );
  return toIsoAtLocalMidnight(targetDate);
};

export const buildSuggestedVersionId = ({
  planCode,
  effectiveAt,
  versions,
}: {
  planCode: string;
  effectiveAt: unknown;
  versions: Array<UnknownRecord>;
}): string => {
  const sanitizedPlanCode = sanitizePlanCodeSegment(toCleanString(planCode));
  const maxSequence = versions.reduce((currentMax, version) => {
    const versionRecord = asRecord(version);
    const versionId =
      toCleanString(versionRecord.versionId) || toCleanString(versionRecord.version);
    return Math.max(currentMax, extractVersionSequence(versionId) || 0);
  }, 0);
  const nextSequence = maxSequence > 0 ? maxSequence + 1 : versions.length + 1;
  return `${sanitizedPlanCode}-v${pad(nextSequence)}-${resolveDateSegment(effectiveAt)}`;
};

export const buildVersionEditorSeed = (
  plan: UnknownRecord | null,
): VersionEditorSeed | null => {
  const versionSource = resolveVersionSource(plan);
  const planCode = toCleanString(versionSource.planCode);
  if (!planCode) return null;

  const entitlements = normalizeSubscriptionEntitlements(versionSource);
  const displayName = toCleanString(versionSource.displayName) || planCode.toUpperCase();
  const priceMonthly = toFiniteNumber(versionSource.priceMonthly) ?? 0;
  const noticeWindowDays = normalizeNoticeWindowDays(versionSource.noticeWindowDays);
  const versionId =
    toCleanString(versionSource.versionId) || toCleanString(versionSource.version) || '';
  const effectiveAtMillis = toMillis(versionSource.effectiveAt);

  return {
    planCode,
    displayName,
    priceMonthly,
    noticeWindowDays,
    versionId,
    effectiveAt: effectiveAtMillis
      ? toIsoAtLocalMidnight(new Date(effectiveAtMillis))
      : '',
    limitsJson: JSON.stringify(asRecord(versionSource.limits), null, 2),
    modulesJson: JSON.stringify(entitlements.modules, null, 2),
    addonsJson: JSON.stringify(entitlements.addons, null, 2),
  };
};
