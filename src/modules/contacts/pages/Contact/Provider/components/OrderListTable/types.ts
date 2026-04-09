import type { ProviderRecord } from '@/firebase/provider/types';

export type ProviderTableRow = ProviderRecord &
  Record<string, unknown> & {
    tableIndex?: number;
  };
