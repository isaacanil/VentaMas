import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

import type { MonthlyComplianceReportCode } from './fbRunMonthlyComplianceReport';

export interface ExportDgiiTxtReportInput {
  businessId: string;
  periodKey: string;
  reportCode: MonthlyComplianceReportCode;
}

export interface ExportDgiiTxtReportResult {
  ok: boolean;
  content: string;
  fileName: string;
  rowCount: number;
}

export const fbExportDgiiTxtReport = async ({
  businessId,
  periodKey,
  reportCode,
}: ExportDgiiTxtReportInput): Promise<ExportDgiiTxtReportResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    ExportDgiiTxtReportInput & { sessionToken?: string },
    ExportDgiiTxtReportResult
  >(functions, 'exportDgiiTxtReport');

  const response = await callable({
    businessId,
    periodKey,
    reportCode,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.data;
};
