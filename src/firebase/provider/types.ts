import type { Timestamp } from 'firebase/firestore';
import type { ProviderInfo } from '@/domain/providers/types';

export type ProviderStatus = 'active' | 'inactive' | (string & {});

export interface ProviderRecord extends ProviderInfo {
  id: string;
  createdAt?: Timestamp;
  status?: ProviderStatus;
}

export interface ProviderDocument {
  provider: ProviderRecord;
}
