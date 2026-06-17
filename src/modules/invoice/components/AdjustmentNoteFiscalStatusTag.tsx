import { Tag, Tooltip, Typography } from 'antd';
import React from 'react';

import {
  resolveElectronicTaxReceiptDiagnosticText,
  resolveElectronicTaxReceiptStatusDisplay,
} from '@/modules/invoice/utils/electronicTaxReceipt';

import type { ElectronicTaxReceiptSnapshot } from '@/types/invoice';

type DiagnosticDisplay = 'tooltip' | 'below' | 'none';

type AdjustmentNoteFiscalStatusTagProps = {
  snapshot?: ElectronicTaxReceiptSnapshot | null;
  fallbackStatus?: unknown;
  emptyLabel?: string;
  diagnosticDisplay?: DiagnosticDisplay;
};

export const AdjustmentNoteFiscalStatusTag = ({
  snapshot,
  fallbackStatus,
  emptyLabel = 'No aplica',
  diagnosticDisplay = 'tooltip',
}: AdjustmentNoteFiscalStatusTagProps) => {
  const fiscalStatus = resolveElectronicTaxReceiptStatusDisplay(
    snapshot,
    fallbackStatus,
  );
  const diagnostic =
    diagnosticDisplay === 'none'
      ? null
      : resolveElectronicTaxReceiptDiagnosticText(snapshot);
  const tag = (
    <Tag color={fiscalStatus?.color || 'default'}>
      {fiscalStatus?.label || emptyLabel}
    </Tag>
  );

  if (!diagnostic) return tag;

  if (diagnosticDisplay === 'below') {
    return (
      <>
        {tag}
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginTop: 4 }}
        >
          {diagnostic}
        </Typography.Text>
      </>
    );
  }

  return <Tooltip title={diagnostic}>{tag}</Tooltip>;
};
