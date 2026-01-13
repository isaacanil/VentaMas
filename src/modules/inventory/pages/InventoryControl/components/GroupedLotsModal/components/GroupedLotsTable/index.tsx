import styled from 'styled-components';

import { GroupedLotsTableBody } from './components/GroupedLotsTableBody';
import { GroupedLotsTableHeader } from './components/GroupedLotsTableHeader';
import { GroupedLotsSummary } from './components/GroupedLotsSummary';

import type {
  BaselineSnapshot,
  CountsMap,
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryGroup,
  LocationNamesMap,
  ResolvingMap,
} from '@/utils/inventory/types';

interface GroupedLotsTableProps {
  group: InventoryGroup;
  counts: CountsMap;
  countsMeta: CountsMetaMap;
  usersNameCache: Record<string, string>;
  locationNamesMap?: LocationNamesMap;
  resolvingLocations?: ResolvingMap;
  expirationEdits?: ExpirationEditsMap;
  onChangeExpiration?: (key: string, value: string | null | undefined) => void;
  onChangeCount: (key: string, value: number) => void;
  serverCounts?: CountsMap;
  readOnly?: boolean;
  baselineSnapshot?: BaselineSnapshot;
}

export function GroupedLotsTable({
  group,
  counts,
  countsMeta,
  usersNameCache,
  locationNamesMap = {},
  resolvingLocations = {},
  expirationEdits = {},
  onChangeExpiration,
  onChangeCount,
  serverCounts = {},
  readOnly = false,
  baselineSnapshot,
}: GroupedLotsTableProps) {
  if (!group) return null;

  return (
    <>
      <SimpleTable>
        <GroupedLotsTableHeader />
        <GroupedLotsTableBody
          group={group}
          counts={counts}
          countsMeta={countsMeta}
          usersNameCache={usersNameCache}
          locationNamesMap={locationNamesMap}
          resolvingLocations={resolvingLocations}
          expirationEdits={expirationEdits}
          onChangeExpiration={onChangeExpiration}
          onChangeCount={onChangeCount}
          serverCounts={serverCounts}
          readOnly={readOnly}
          baselineSnapshot={baselineSnapshot}
        />
      </SimpleTable>
      <GroupedLotsSummary group={group} />
    </>
  );
}

const SimpleTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead th {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  tbody td {
    padding: 10px 8px;
    vertical-align: top;
    border-bottom: 1px solid #f5f5f5;
  }
`;

export default GroupedLotsTable;
