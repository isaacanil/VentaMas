import { exportBusinessWorkbook } from './exportWorkbook';

import type { BusinessAuditResult } from '../types';

type FiscalReceiptsAuditExportResult =
  | {
      status: 'success';
    }
  | {
      errorMessage: string;
      status: 'error';
    };

export const runFiscalReceiptsAuditExport = async ({
  businessResult,
  endDate,
  startDate,
}: {
  businessResult: BusinessAuditResult;
  endDate: Date | null;
  startDate: Date | null;
}): Promise<FiscalReceiptsAuditExportResult> => {
  try {
    await exportBusinessWorkbook(businessResult, startDate, endDate);
    return {
      status: 'success',
    };
  } catch (error) {
    console.error('Error exportando Excel', error);
    return {
      status: 'error',
      errorMessage: 'Ocurrió un error durante la exportación.',
    };
  }
};
