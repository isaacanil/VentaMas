export type DomainKey = 'invoices' | 'accountsReceivablePayments' | 'purchases' | 'expenses';

export interface MonetaryInfo {
  documentCurrency: string | null;
  functionalCurrency: string | null;
  rate: number | null;
  capturedAt: number | null;
  snippet: string;
}

export interface AuditRow {
  id: string;
  date: number | null;
  amount: number | null;
  hasMonetary: boolean;
  monetary: MonetaryInfo | null;
}

export interface DomainAuditResult {
  domain: DomainKey;
  rows: AuditRow[];
  error: string | null;
  loading: boolean;
}

export interface AuditState {
  invoices: DomainAuditResult;
  accountsReceivablePayments: DomainAuditResult;
  purchases: DomainAuditResult;
  expenses: DomainAuditResult;
}
