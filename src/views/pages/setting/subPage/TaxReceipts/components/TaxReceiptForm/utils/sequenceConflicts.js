import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "../../../../../../../../firebase/firebaseconfig";
import { getNcfLedgerInsights } from "../../../../../../../../firebase/taxReceipt/getNcfLedgerInsights";

import {
  MAX_IN_QUERY_VALUES,
  buildCandidateCodes,
  buildPrefix,
  chunkArray,
  collapseWhitespace,
  normalizeDigits,
  resolveIncrement,
  toDigits,
} from "./ncfUtils";

const MAX_SEQUENCE_LOOKAHEAD = 150;
const MAX_SEQUENCE_WARNING_LOOKAHEAD = 40;
const MAX_SEQUENCE_LOOKBEHIND = 12;
const MAX_SEQUENCE_REPORT_ITEMS = 12;

const DEFAULT_RESOLVER = (normalizedDigitsLength) => normalizedDigitsLength ?? 0;

const adaptLedgerResponse = ({ ledgerResult, sequenceLengthEstimate }) => {
  if (!ledgerResult || ledgerResult.source !== "ledger") {
    return null;
  }

  const nextDigitsRaw = ledgerResult.nextDigits
    ?? normalizeDigits((ledgerResult.nextNumber ?? "").toString());
  const sequenceLength = Math.max(
    sequenceLengthEstimate,
    nextDigitsRaw?.length ?? 0,
    ledgerResult.normalizedDigits?.length ?? 0
  );

  const nextDigits = (nextDigitsRaw ?? "").padStart(sequenceLength, "0");

  return {
    ok: ledgerResult.ok !== false,
    reason: ledgerResult.reason,
    prefix: ledgerResult.prefix,
    nextNumber: ledgerResult.nextNumber,
    nextDigits,
    nextDigitsLength: nextDigits.length,
    sequenceLength,
    hasCurrentConflict: !!ledgerResult.hasCurrentConflict,
    hasImmediateNextConflict: !!ledgerResult.hasImmediateNextConflict,
    conflicts: Array.isArray(ledgerResult.conflicts) ? ledgerResult.conflicts : [],
    insights: ledgerResult.insights ?? {},
    metadata: ledgerResult.metadata ?? null,
    source: "ledger",
  };
};

const fetchLedgerInsightsSafe = async (payload) => {
  try {
    const result = await getNcfLedgerInsights(payload);
    return result;
  } catch (error) {
    console.error("Error al consultar el ledger de NCF:", error);
    return { source: "ledger-error", error: error?.message };
  }
};

export const createSequenceConflictChecker = ({
  businessID,
  userID,
  resolveSequenceLength,
} = {}) => {
  const resolver = typeof resolveSequenceLength === "function"
    ? resolveSequenceLength
    : DEFAULT_RESOLVER;

  return async (formValues) => {
    if (!businessID) return { ok: true };

    const prefix = buildPrefix(formValues.type, formValues.serie);
    if (!prefix) return { ok: true };

    const rawDigits = toDigits(formValues.sequence ?? "");
    if (!rawDigits) return { ok: false, reason: "invalid-sequence" };

    const normalizedDigits = normalizeDigits(rawDigits);
    const baseNumber = Number(normalizedDigits);
    if (!Number.isFinite(baseNumber)) return { ok: false, reason: "invalid-sequence" };

    const increment = resolveIncrement(formValues.increase);
    const nextNumber = baseNumber + increment;
    const nextDigitsRaw = nextNumber.toString();
    const normalizedNextDigits = normalizeDigits(nextDigitsRaw);

    const sequenceLengthEstimate = resolver(
      Math.max(normalizedDigits.length, normalizedNextDigits.length),
      formValues.sequenceLength
    );

    const quantityNumeric = Number(formValues.quantity);
    const quantitySteps = Number.isFinite(quantityNumeric)
      ? Math.max(Math.floor(quantityNumeric) - 1, 0)
      : 0;

    const forwardSteps = Math.max(
      1,
      Math.min(
        MAX_SEQUENCE_LOOKAHEAD,
        quantitySteps > 0
          ? Math.min(quantitySteps, MAX_SEQUENCE_WARNING_LOOKAHEAD)
          : MAX_SEQUENCE_WARNING_LOOKAHEAD
      )
    );

    const backwardSteps = Math.min(MAX_SEQUENCE_LOOKBEHIND, forwardSteps);

    const shouldUseLedger = Boolean(userID);
    if (shouldUseLedger) {
      const ledgerPayload = {
        businessId: businessID,
        userId: userID,
        prefix,
        sequenceNumber: baseNumber,
        normalizedDigits,
        increment,
        windowBefore: backwardSteps,
        windowAfter: forwardSteps,
        quantitySteps,
        sequenceLength: sequenceLengthEstimate,
      };

      const ledgerResult = await fetchLedgerInsightsSafe(ledgerPayload);
      if (ledgerResult?.source === "ledger") {
        const adapted = adaptLedgerResponse({
          ledgerResult,
          sequenceLengthEstimate,
        });
        if (adapted) {
          return adapted;
        }
      }
    }

    const codeMap = new Map();
    const queryCodes = new Set();

    const registerCodes = (meta, codes) => {
      codes.forEach((candidate) => {
        if (!candidate) return;
        const trimmed = candidate.trim();
        if (!trimmed) return;
        queryCodes.add(trimmed);
        const lookupKey = collapseWhitespace(trimmed).toUpperCase();
        if (!codeMap.has(lookupKey)) {
          codeMap.set(lookupKey, meta);
        }
      });
    };

    const registerMetaCodes = (meta, { rawDigits: rawDigitsCandidate } = {}) => {
      const normalizedDigitsForMeta = meta.normalizedDigits ?? "";
      const rawDigitsForMeta = rawDigitsCandidate ?? meta.rawDigits ?? normalizedDigitsForMeta;

      const baseCandidates = buildCandidateCodes({
        prefix,
        rawDigits: rawDigitsForMeta,
        normalizedDigits: normalizedDigitsForMeta,
        sequenceLengthEstimate,
      });

      const candidateSet = new Set(baseCandidates);
      candidateSet.add(meta.ncf);
      candidateSet.add(`${prefix}${normalizedDigitsForMeta}`);

      if (rawDigitsForMeta && rawDigitsForMeta !== normalizedDigitsForMeta) {
        candidateSet.add(`${prefix}${rawDigitsForMeta}`);
      }

      const digitsWithPrefix = new Set();
      candidateSet.forEach((code) => {
        const trimmed = (code ?? "").trim();
        if (!trimmed) return;
        if (trimmed.toUpperCase().startsWith(prefix)) {
          const digitsPart = trimmed.slice(prefix.length).trim();
          if (digitsPart) {
            digitsWithPrefix.add(digitsPart);
          }
        }
      });

      digitsWithPrefix.forEach((digitsPart) => {
        candidateSet.add(`${prefix}-${digitsPart}`);
        candidateSet.add(`${prefix} ${digitsPart}`);
      });

      registerCodes(meta, Array.from(candidateSet));
    };

    const buildMeta = ({ number, step, position, rawDigitsOverride }) => {
      const digitsSource = rawDigitsOverride ?? number.toString();
      const normalized = normalizeDigits(digitsSource);
      const paddedDigits = normalized.padStart(sequenceLengthEstimate, "0");
      const baseCode = `${prefix}${paddedDigits}`;

      const meta = {
        number,
        step,
        position,
        normalizedDigits: normalized,
        paddedDigits,
        rawDigits: digitsSource,
        ncf: baseCode,
        invoices: [],
      };

      registerMetaCodes(meta, { rawDigits: digitsSource });
      return meta;
    };

    const baseNumberMeta = buildMeta({
      number: baseNumber,
      step: 0,
      position: "current",
      rawDigitsOverride: rawDigits,
    });

    const beforeMetas = [];
    for (let step = 1; step <= backwardSteps; step += 1) {
      const candidateNumber = baseNumber - increment * step;
      if (candidateNumber < 0) break;
      beforeMetas.push(
        buildMeta({ number: candidateNumber, step, position: "before" })
      );
    }

    const afterMetas = [];
    for (let step = 1; step <= forwardSteps; step += 1) {
      const candidateNumber = baseNumber + increment * step;
      afterMetas.push(
        buildMeta({ number: candidateNumber, step, position: "after" })
      );
    }

    const codesToQuery = Array.from(queryCodes);
    if (!codesToQuery.length) {
      return {
        ok: true,
        prefix,
        nextNumber,
        nextDigits: normalizedNextDigits,
        nextDigitsLength: normalizedNextDigits.length,
      };
    }

    const invoicesRef = collection(db, "businesses", businessID, "invoices");
    const codeChunks = chunkArray(codesToQuery, MAX_IN_QUERY_VALUES);

    for (const chunk of codeChunks) {
      if (!chunk.length) continue;

      const invoicesQuery = query(invoicesRef, where("data.NCF", "in", chunk));
      const snapshot = await getDocs(invoicesQuery);

      snapshot.forEach((docSnap) => {
        const invoiceData = docSnap.data();
        const invoiceNcf =
          invoiceData?.data?.NCF ??
          invoiceData?.data?.ncf ??
          invoiceData?.data?.comprobante ??
          null;
        if (!invoiceNcf) return;
        const normalizedInvoiceCode = collapseWhitespace(invoiceNcf).toUpperCase();
        const meta = codeMap.get(normalizedInvoiceCode);
        if (!meta) return;

        meta.invoices.push({ id: docSnap.id, ncf: invoiceNcf });
      });
    }

    const hasCurrentConflict = baseNumberMeta.invoices.length > 0;

    const sortedAfter = afterMetas.sort((a, b) => a.step - b.step);
    const sortedBefore = beforeMetas.sort((a, b) => a.step - b.step);

    const immediateNextMeta = sortedAfter.find((meta) => meta.step === 1);
    const hasImmediateNextConflict =
      (immediateNextMeta?.invoices?.length ?? 0) > 0;

    const contiguousAvailableBefore = [];
    for (const meta of sortedBefore) {
      if (meta.invoices.length === 0) {
        contiguousAvailableBefore.push(meta);
      } else {
        break;
      }
    }

    const usedAfter = sortedAfter.filter((meta) => meta.invoices.length > 0);
    const usedBefore = sortedBefore.filter((meta) => meta.invoices.length > 0);

    const contiguousAvailableAfter = [];
    for (const meta of sortedAfter) {
      if (meta.invoices.length === 0) {
        contiguousAvailableAfter.push(meta);
      } else {
        break;
      }
    }

    const allUsedMetas = [
      ...(hasCurrentConflict ? [baseNumberMeta] : []),
      ...usedBefore,
      ...usedAfter,
    ];

    const lastUsedMeta = allUsedMetas.reduce((best, meta) => {
      if (!meta) return best;
      if (!best || meta.number > best.number) {
        return meta;
      }
      return best;
    }, null);

    const formatMeta = (meta) => ({
      number: meta.number,
      ncf: meta.ncf,
      step: meta.step,
      invoices: meta.invoices,
      normalizedDigits: meta.normalizedDigits,
    });

    const insights = {
      currentConflict: hasCurrentConflict ? formatMeta(baseNumberMeta) : null,
      availableBefore: contiguousAvailableBefore
        .slice(0, MAX_SEQUENCE_REPORT_ITEMS)
        .map((meta) => ({
          number: meta.number,
          ncf: meta.ncf,
          step: meta.step,
        })),
      availableAfter: contiguousAvailableAfter
        .slice(0, MAX_SEQUENCE_REPORT_ITEMS)
        .map((meta) => ({
          number: meta.number,
          ncf: meta.ncf,
          step: meta.step,
        })),
      usedBefore: usedBefore
        .slice(0, MAX_SEQUENCE_REPORT_ITEMS)
        .map((meta) => formatMeta(meta)),
      usedAfter: usedAfter
        .slice(0, MAX_SEQUENCE_REPORT_ITEMS)
        .map((meta) => formatMeta(meta)),
      lastUsed: lastUsedMeta ? formatMeta(lastUsedMeta) : null,
    };

    const conflictInvoices = hasCurrentConflict
      ? baseNumberMeta.invoices
      : hasImmediateNextConflict
      ? immediateNextMeta?.invoices ?? []
      : undefined;

    return {
      ok: !hasCurrentConflict && !hasImmediateNextConflict,
      reason: hasCurrentConflict
        ? "current-sequence-used"
        : hasImmediateNextConflict
        ? "next-sequence-used"
        : undefined,
      prefix,
      nextNumber,
      nextDigits: normalizedNextDigits,
      nextDigitsLength: normalizedNextDigits.length,
      sequenceLength: sequenceLengthEstimate,
      conflicts: conflictInvoices,
      insights,
      hasCurrentConflict,
      hasImmediateNextConflict,
    };
  };
};

export {
  MAX_SEQUENCE_LOOKAHEAD,
  MAX_SEQUENCE_WARNING_LOOKAHEAD,
  MAX_SEQUENCE_LOOKBEHIND,
  MAX_SEQUENCE_REPORT_ITEMS,
};
