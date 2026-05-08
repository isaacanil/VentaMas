export type ErrorReportStatus = 'pending' | 'resolved' | string;

export interface ErrorReportRow {
  id: string;
  userId: string | null;
  userLabel: string;
  businessId: string | null;
  businessLabel: string;
  createdAt: Date | null;
  createdAtLabel: string;
  status: ErrorReportStatus;
  errorStackTrace: string;
  errorInfo: string;
}

export interface ErrorReportSummary {
  pending: number;
  resolved: number;
  total: number;
}
