import { SummaryBar } from '../../../../inventoryTableComponents';
import { Diff, formatNumber } from '../../../../inventoryTableUtils';

import type { InventoryGroup } from '@/utils/inventory/types';

interface GroupedLotsSummaryProps {
  group: InventoryGroup;
}

export function GroupedLotsSummary({ group }: GroupedLotsSummaryProps) {
  const list = group._children || [];
  const totalStock = Number(group.totalStock || 0);
  const totalReal = Number(group.totalReal || 0);
  const totalDiff = totalReal - totalStock;

  return (
    <div style={{ marginTop: 16 }}>
      <SummaryBar
        stats={[
          { label: 'Lotes', value: list.length },
          { label: 'Stock total', value: formatNumber(totalStock) },
          { label: 'Conteo real total', value: formatNumber(totalReal) },
          {
            label: 'Diferencia',
            value: <Diff $value={totalDiff}>{formatNumber(totalDiff)}</Diff>,
          },
        ]}
        justify="flex-start"
      />
    </div>
  );
}
