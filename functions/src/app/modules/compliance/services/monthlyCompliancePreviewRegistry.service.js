import { buildDgii606ValidationPreview } from './dgii606MonthlyReport.service.js';
import { buildDgii607ValidationPreview } from './dgii607MonthlyReport.service.js';
import { buildDgii608ValidationPreview } from './dgii608MonthlyReport.service.js';

export const MONTHLY_COMPLIANCE_PREVIEW_BUILDERS = Object.freeze({
  DGII_606: buildDgii606ValidationPreview,
  DGII_607: buildDgii607ValidationPreview,
  DGII_608: buildDgii608ValidationPreview,
});

export const getMonthlyCompliancePreviewBuilder = (reportCode) =>
  MONTHLY_COMPLIANCE_PREVIEW_BUILDERS[reportCode] ?? null;

export const buildMonthlyCompliancePreview = async ({
  reportCode,
  ...rest
}) => {
  const builder = getMonthlyCompliancePreviewBuilder(reportCode);
  if (!builder) {
    throw new Error(`No existe preview builder para ${reportCode}`);
  }

  return builder(rest);
};
