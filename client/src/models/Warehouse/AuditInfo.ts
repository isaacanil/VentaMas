import { Timestamp } from 'firebase/firestore';

// ... (configuración de Firebase)
export interface AuditInfo {
    createdAt: Timestamp;
    createdBy: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
    deletedAt?: Timestamp;
    deletedBy?: string;
}