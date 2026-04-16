import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

export type MonthlyComplianceReportCode =
  | 'DGII_606'
  | 'DGII_607'
  | 'DGII_608';

export interface RunMonthlyComplianceReportInput {
  businessId: string;
  periodKey: string;
  reportCode: MonthlyComplianceReportCode;
}

export interface RunMonthlyComplianceReportResult {
  ok: boolean;
  pilotMode: boolean;
  reportRunId: string;
  reportCode: MonthlyComplianceReportCode;
  periodKey: string;
  version: number;
  status: string;
  issueSummary: {
    total: number;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
    byCode: Record<string, number>;
  };
}

export const fbRunMonthlyComplianceReport = async ({
  businessId,
  periodKey,
  reportCode,
}: RunMonthlyComplianceReportInput): Promise<RunMonthlyComplianceReportResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    RunMonthlyComplianceReportInput & { sessionToken?: string },
    RunMonthlyComplianceReportResult
  >(functions, 'runMonthlyComplianceReport');

  const response = await callable({
    businessId,
    periodKey,
    reportCode,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.data;
};
