import type { BankStatementLine, LiquidityLedgerEntry } from '@/types/accounting';
import { suggestBankStatementLineMatch } from '@/modules/treasury/utils/bankStatementMatching';

export interface ParsedBankStatementImportRow {
  amount: number;
  description: string | null;
  direction: 'in' | 'out';
  id: string;
  reference: string | null;
  sourceLineNumber: number;
  statementDate: Date;
}

export interface PlannedBankStatementImportRow
  extends ParsedBankStatementImportRow {
  confidence: 'high' | 'medium' | 'low' | null;
  matchReason: string | null;
  matchedAmount: number;
  movementIds: string[];
  movementLabels: string[];
  matchStatus: 'pending' | 'reconciled';
}

export interface ParsedBankStatementImportResult {
  format: 'csv' | 'ofx';
  issues: string[];
  rows: ParsedBankStatementImportRow[];
}

const normalizeHeader = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const cleanText = (value: unknown) => {
  const normalized = String(value ?? '').trim();
  return normalized.length ? normalized : null;
};

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

const parseAmount = (value: unknown) => {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/\((.*)\)/, '-$1');

  if (!normalized) return null;

  const commaCount = (normalized.match(/,/g) ?? []).length;
  const dotCount = (normalized.match(/\./g) ?? []).length;

  let candidate = normalized;
  if (commaCount > 0 && dotCount > 0) {
    candidate =
      normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
        ? normalized.replace(/\./g, '').replace(',', '.')
        : normalized.replace(/,/g, '');
  } else if (commaCount > 0 && dotCount === 0) {
    candidate = normalized.replace(',', '.');
  }

  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? roundToTwoDecimals(parsed) : null;
};

const parseDate = (value: unknown) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;

  const direct = Date.parse(normalized);
  if (!Number.isNaN(direct)) {
    return new Date(direct);
  }

  const slashMatch = normalized.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/,
  );
  if (slashMatch) {
    const [, first, second, third] = slashMatch;
    const year = third.length === 2 ? `20${third}` : third;
    const firstNumber = Number(first);
    const secondNumber = Number(second);
    const asDayFirst =
      firstNumber > 12 ||
      (secondNumber <= 12 &&
        normalized.includes('/') &&
        normalized.split('/')[0].length <= 2);
    const day = asDayFirst ? first : second;
    const month = asDayFirst ? second : first;
    const parsed = Date.parse(`${year}-${month}-${day}`);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed);
    }
  }

  return null;
};

const splitCsvLine = (line: string, delimiter: string) => {
  const cells: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const detectCsvDelimiter = (headerLine: string) => {
  const delimiters = [',', ';', '\t'];
  return (
    delimiters
      .map((delimiter) => ({
        count: headerLine.split(delimiter).length,
        delimiter,
      }))
      .sort((left, right) => right.count - left.count)[0]?.delimiter ?? ','
  );
};

const resolveCsvField = (
  record: Record<string, string>,
  aliases: string[],
) => {
  const normalizedEntries = Object.entries(record).map(([key, value]) => [
    normalizeHeader(key),
    value,
  ]);

  for (const alias of aliases) {
    const match = normalizedEntries.find(([key]) => key === alias);
    if (match) return match[1];
  }

  return null;
};

const parseCsvRows = (text: string): ParsedBankStatementImportResult => {
  const normalizedLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (normalizedLines.length < 2) {
    return {
      format: 'csv',
      issues: ['El CSV no tiene filas suficientes para importar.'],
      rows: [],
    };
  }

  const delimiter = detectCsvDelimiter(normalizedLines[0]);
  const headers = splitCsvLine(normalizedLines[0], delimiter);
  const rows: ParsedBankStatementImportRow[] = [];
  const issues: string[] = [];

  normalizedLines.slice(1).forEach((line, rowIndex) => {
    const sourceLineNumber = rowIndex + 2;
    const values = splitCsvLine(line, delimiter);
    const record = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? '']),
    );

    const dateValue = resolveCsvField(record, [
      'fecha',
      'date',
      'transactiondate',
      'postingdate',
      'valuedate',
    ]);
    const amountValue = resolveCsvField(record, ['monto', 'amount', 'importe']);
    const debitValue = resolveCsvField(record, ['debito', 'debit', 'withdrawal']);
    const creditValue = resolveCsvField(record, ['credito', 'credit', 'deposit']);
    const description = cleanText(
      resolveCsvField(record, [
        'descripcion',
        'description',
        'memo',
        'details',
        'concepto',
        'nombre',
      ]),
    );
    const reference = cleanText(
      resolveCsvField(record, [
        'referencia',
        'reference',
        'documento',
        'fitid',
        'transactionid',
      ]),
    );

    const statementDate = parseDate(dateValue);
    if (!statementDate) {
      issues.push(`Fila ${sourceLineNumber}: fecha inválida o ausente.`);
      return;
    }

    let signedAmount = parseAmount(amountValue);
    if (signedAmount == null) {
      const debitAmount = parseAmount(debitValue);
      const creditAmount = parseAmount(creditValue);
      if (debitAmount != null && debitAmount !== 0) {
        signedAmount = -Math.abs(debitAmount);
      } else if (creditAmount != null && creditAmount !== 0) {
        signedAmount = Math.abs(creditAmount);
      }
    }

    if (signedAmount == null || signedAmount === 0) {
      issues.push(`Fila ${sourceLineNumber}: monto inválido o ausente.`);
      return;
    }

    rows.push({
      amount: Math.abs(signedAmount),
      description,
      direction: signedAmount < 0 ? 'out' : 'in',
      id: `csv-${sourceLineNumber}`,
      reference,
      sourceLineNumber,
      statementDate,
    });
  });

  return {
    format: 'csv',
    issues,
    rows,
  };
};

const parseOfxDate = (value: string | null) => {
  const normalized = cleanText(value);
  if (!normalized) return null;

  const compact = normalized.replace(/\[.*$/, '');
  const match = compact.match(
    /^(\d{4})(\d{2})(\d{2})(\d{0,2})(\d{0,2})(\d{0,2})/,
  );
  if (!match) return null;

  const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour || '00'),
      Number(minute || '00'),
      Number(second || '00'),
    ),
  );
};

const parseOfxRows = (text: string): ParsedBankStatementImportResult => {
  const rows: ParsedBankStatementImportRow[] = [];
  const issues: string[] = [];
  const blocks = text.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi) ?? [];

  blocks.forEach((block, index) => {
    const extractTag = (tag: string) => {
      const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i'));
      return cleanText(match?.[1]);
    };

    const statementDate = parseOfxDate(
      extractTag('DTPOSTED') ?? extractTag('DTUSER'),
    );
    const signedAmount = parseAmount(extractTag('TRNAMT'));
    if (!statementDate || signedAmount == null || signedAmount === 0) {
      issues.push(`Movimiento OFX ${index + 1}: fecha o monto inválido.`);
      return;
    }

    rows.push({
      amount: Math.abs(signedAmount),
      description: cleanText(
        [extractTag('NAME'), extractTag('MEMO')].filter(Boolean).join(' · '),
      ),
      direction: signedAmount < 0 ? 'out' : 'in',
      id: `ofx-${index + 1}`,
      reference: cleanText(extractTag('FITID')),
      sourceLineNumber: index + 1,
      statementDate,
    });
  });

  if (!rows.length && !issues.length) {
    issues.push('No se encontraron transacciones STMTTRN en el OFX.');
  }

  return {
    format: 'ofx',
    issues,
    rows,
  };
};

export const parseBankStatementImport = ({
  fileName,
  text,
}: {
  fileName?: string | null;
  text: string;
}): ParsedBankStatementImportResult => {
  const normalizedName = String(fileName ?? '').toLowerCase();
  const normalizedText = text.trim();
  const looksLikeOfx =
    normalizedName.endsWith('.ofx') ||
    normalizedName.endsWith('.qfx') ||
    /<OFX>|<STMTTRN>/i.test(normalizedText);

  return looksLikeOfx
    ? parseOfxRows(normalizedText)
    : parseCsvRows(normalizedText);
};

const toPseudoStatementLine = (
  row: ParsedBankStatementImportRow,
): BankStatementLine => ({
  amount: row.amount,
  bankAccountId: 'preview-bank-account',
  businessId: 'preview-business',
  id: row.id,
  lineType: 'transaction',
  metadata: {},
  reference: row.reference,
  statementDate: row.statementDate,
  status: 'pending',
  direction: row.direction,
  description: row.description,
});

const buildMovementLabel = (entry: LiquidityLedgerEntry) =>
  entry.reference || entry.description || entry.sourceType || entry.id;

export const planBankStatementImport = ({
  entries,
  rows,
}: {
  entries: LiquidityLedgerEntry[];
  rows: ParsedBankStatementImportRow[];
}): PlannedBankStatementImportRow[] => {
  const availableEntries = [...entries];

  return rows.map((row) => {
    const suggestion = suggestBankStatementLineMatch({
      entries: availableEntries,
      line: toPseudoStatementLine(row),
    });

    if (!suggestion) {
      return {
        ...row,
        confidence: null,
        matchedAmount: 0,
        matchReason: null,
        matchStatus: 'pending',
        movementIds: [],
        movementLabels: [],
      };
    }

    const plannedEntries = availableEntries.filter((entry) =>
      suggestion.movementIds.includes(entry.id),
    );
    plannedEntries.forEach((entry) => {
      const entryIndex = availableEntries.findIndex(
        (candidate) => candidate.id === entry.id,
      );
      if (entryIndex >= 0) {
        availableEntries.splice(entryIndex, 1);
      }
    });

    return {
      ...row,
      confidence: suggestion.confidence,
      matchedAmount: suggestion.movementTotal,
      matchReason: suggestion.reason,
      matchStatus: 'reconciled',
      movementIds: suggestion.movementIds,
      movementLabels: plannedEntries.map(buildMovementLabel),
    };
  });
};
