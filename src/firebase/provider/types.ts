import type { Timestamp } from 'firebase/firestore';
import type { ProviderInfo } from '@/utils/provider/types';

export type ProviderStatus = 'active' | 'inactive' | (string & {});

export interface ProviderRecord extends ProviderInfo {
  id: string;
  createdAt?: Timestamp;
  status?: ProviderStatus;
}

export interface ProviderDocument {
  provider: ProviderRecord;
}
