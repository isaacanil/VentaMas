import type { Dispatch, ReactNode, SetStateAction } from 'react';

import type {
  BaselineSnapshot,
  CountsMap,
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryGroup,
  LocationNamesMap,
  ResolvingMap,
} from '@/utils/inventory/types';

export type InventoryRowMeta = InventoryGroup & {
  productNameNode: ReactNode;
  conteoNode: ReactNode;
  diffNode: ReactNode;
  userNode: ReactNode;
  expirationNode: ReactNode;
  expirationSortValue: string;
  locationsNode: ReactNode;
  actionsNode: ReactNode;
  _hasMultipleLots: boolean;
};

export interface UseGroupedRowMetaParams {
  baselineSnapshot: BaselineSnapshot;
  groups?: InventoryGroup[];
  counts: CountsMap;
  countsMeta: CountsMetaMap;
  expirationEdits: ExpirationEditsMap;
  locationNamesMap: LocationNamesMap;
  onChangeCount: (key: string, value: number) => void;
  onChangeExpiration?: (key: string, value: string | null | undefined) => void;
  readOnly: boolean;
  resolvingLocations: ResolvingMap;
  resolvingUIDs: ResolvingMap;
  serverCounts: CountsMap;
  usersNameCache: Record<string, string>;
  setModalGroup: Dispatch<SetStateAction<InventoryGroup | null>>;
}

export type BuildGroupedRowMetaParams = Omit<UseGroupedRowMetaParams, 'groups'> & {
  group: InventoryGroup;
};
