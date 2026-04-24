import type { BankStatementLine, LiquidityLedgerEntry } from '@/types/accounting';
import { toMillis } from '@/utils/firebase/toTimestamp';

export interface BankStatementMatchSuggestion {
  confidence: 'high' | 'medium' | 'low';
  movementIds: string[];
  movementTotal: number;
  reason: string;
}

const normalizeSignedAmount = (
  value: Pick<LiquidityLedgerEntry, 'amount' | 'direction'>,
) => {
  const amount = Number(value.amount ?? 0);
  return value.direction === 'out' ? -amount : amount;
};

const normalizeLineSignedAmount = (line: BankStatementLine) => {
  const amount = Number(line.amount ?? 0);
  return line.direction === 'out' ? -amount : amount;
};

const toTokenSet = (value: string | null | undefined) =>
  new Set(
    String(value ?? '')
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4),
  );

const normalizeComparableText = (value: string | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '');

const countTokenOverlap = (
  line: BankStatementLine,
  entries: LiquidityLedgerEntry[],
) => {
  const lineTokens = toTokenSet(
    [line.reference, line.description].filter(Boolean).join(' '),
  );
  const entryTokens = toTokenSet(
    entries
      .map((entry) => [entry.reference, entry.description].filter(Boolean).join(' '))
      .join(' '),
  );

  let overlap = 0;
  lineTokens.forEach((token) => {
    if (entryTokens.has(token)) {
      overlap += 1;
    }
  });
  return overlap;
};

const averageDayDelta = (
  line: BankStatementLine,
  entries: LiquidityLedgerEntry[],
) => {
  const lineMillis = toMillis(line.statementDate as never);
  if (lineMillis == null || entries.length === 0) return Number.POSITIVE_INFINITY;

  const averageMillis =
    entries.reduce((sum, entry) => sum + (toMillis(entry.occurredAt as never) ?? lineMillis), 0) /
    entries.length;
  return Math.abs(lineMillis - averageMillis) / (1000 * 60 * 60 * 24);
};

const describeSuggestionReason = ({
  averageDays,
  entryCount,
  exactReferenceMatch,
  overlap,
}: {
  averageDays: number;
  entryCount: number;
  exactReferenceMatch: boolean;
  overlap: number;
}) => {
  if (exactReferenceMatch || (overlap > 0 && averageDays <= 2)) {
    return entryCount === 1
      ? 'Monto exacto, referencia cercana y fecha consistente.'
      : 'Suma exacta, referencias cercanas y fechas consistentes.';
  }
  if (averageDays <= 3) {
    return entryCount === 1
      ? 'Monto exacto y fecha muy cercana.'
      : 'Suma exacta con fechas cercanas.';
  }
  return entryCount === 1
    ? 'Monto exacto encontrado en el ledger.'
    : 'Combinación exacta encontrada en el ledger.';
};

const resolveConfidence = ({
  averageDays,
  entryCount,
  exactReferenceMatch,
  overlap,
}: {
  averageDays: number;
  entryCount: number;
  exactReferenceMatch: boolean;
  overlap: number;
}): BankStatementMatchSuggestion['confidence'] => {
  if (exactReferenceMatch || (overlap > 0 && averageDays <= 2)) return 'high';
  if (averageDays <= 3 && entryCount <= 2) return 'medium';
  return 'low';
};

const buildCombos = <T,>(items: T[], maxSize: number) => {
  const combos: T[][] = [];

  const visit = (startIndex: number, current: T[]) => {
    if (current.length > 0) {
      combos.push([...current]);
    }
    if (current.length === maxSize) {
      return;
    }

    for (let index = startIndex; index < items.length; index += 1) {
      current.push(items[index]);
      visit(index + 1, current);
      current.pop();
    }
  };

  visit(0, []);
  return combos;
};

export const suggestBankStatementLineMatch = ({
  entries,
  line,
}: {
  entries: LiquidityLedgerEntry[];
  line: BankStatementLine | null;
}): BankStatementMatchSuggestion | null => {
  if (!line || line.lineType !== 'transaction' || line.status !== 'pending') {
    return null;
  }

  const targetAmount = Number(normalizeLineSignedAmount(line).toFixed(2));
  if (!Number.isFinite(targetAmount) || targetAmount === 0) {
    return null;
  }

  const lineMillis = toMillis(line.statementDate as never);
  const candidateEntries = entries
    .filter(
      (entry) =>
        entry.accountType === 'bank' &&
        entry.status !== 'void' &&
        entry.reconciliationStatus !== 'reconciled' &&
        Math.sign(normalizeSignedAmount(entry)) === Math.sign(targetAmount),
    )
    .filter((entry) => {
      const entryMillis = toMillis(entry.occurredAt as never);
      if (lineMillis == null || entryMillis == null) return true;
      return entryMillis <= lineMillis;
    })
    .sort((left, right) => {
      const rightOverlap = countTokenOverlap(line, [right]);
      const leftOverlap = countTokenOverlap(line, [left]);
      if (rightOverlap !== leftOverlap) {
        return rightOverlap - leftOverlap;
      }

      const leftDays = averageDayDelta(line, [left]);
      const rightDays = averageDayDelta(line, [right]);
      return leftDays - rightDays;
    })
    .slice(0, 10);

  const exactCombos = buildCombos(candidateEntries, 3)
    .filter((combo) => {
      const total = Number(
        combo.reduce((sum, entry) => sum + normalizeSignedAmount(entry), 0).toFixed(2),
      );
      return total === targetAmount;
    })
    .map((combo) => {
      const overlap = countTokenOverlap(line, combo);
      const averageDays = averageDayDelta(line, combo);
      const exactReferenceMatch = combo.some(
        (entry) =>
          normalizeComparableText(entry.reference) &&
          normalizeComparableText(entry.reference) ===
            normalizeComparableText(line.reference),
      );
      const score =
        overlap * 100 +
        (exactReferenceMatch ? 120 : 0) -
        averageDays * 10 -
        combo.length * 5;

      return {
        averageDays,
        combo,
        exactReferenceMatch,
        overlap,
        score,
      };
    })
    .sort((left, right) => right.score - left.score);

  if (!exactCombos.length) {
    return null;
  }

  const bestMatch = exactCombos[0];
  const movementTotal = Number(
    bestMatch.combo
      .reduce((sum, entry) => sum + normalizeSignedAmount(entry), 0)
      .toFixed(2),
  );

  return {
    confidence: resolveConfidence({
      averageDays: bestMatch.averageDays,
      entryCount: bestMatch.combo.length,
      exactReferenceMatch: bestMatch.exactReferenceMatch,
      overlap: bestMatch.overlap,
    }),
    movementIds: bestMatch.combo.map((entry) => entry.id),
    movementTotal,
    reason: describeSuggestionReason({
      averageDays: bestMatch.averageDays,
      entryCount: bestMatch.combo.length,
      exactReferenceMatch: bestMatch.exactReferenceMatch,
      overlap: bestMatch.overlap,
    }),
  };
};
