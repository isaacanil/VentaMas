import { Timestamp } from 'firebase/firestore';

export interface AuditInfo {
  createdAt: Timestamp;
  createdBy: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
  deletedAt?: Timestamp;
  deletedBy?: string;
}
