import type { Dayjs } from 'dayjs';

export interface BusinessRecord {
  id: string;
  name?: string;
  business?: {
    name?: string;
    fantasyName?: string;
  };
}

export interface InvoiceAnalysisResult {
  totalInvoices: number;
  invoicesWithNcf: number;
  missingNcf: number;
  skippedWithoutDate: number;
  ncfLengthStats: unknown[];
  lengthChangeEvents: unknown[];
  duplicates: unknown[];
  duplicatesNormalized: unknown[];
  zeroCollapsedDuplicates: unknown[];
  uniqueNcfCount: number;
  observedLengths: number[];
  currentLength: number | null;
}

export interface BusinessAuditResult extends InvoiceAnalysisResult {
  businessId: string;
  businessName?: string;
}

export interface AuditIssue {
  businessId: string;
  businessName?: string;
  message: string;
}

export interface ExportingBusiness {
  id: string;
  name: string;
}

export interface DateRange {
  start: Dayjs | null;
  end: Dayjs | null;
}
