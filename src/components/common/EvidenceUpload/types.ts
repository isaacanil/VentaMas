import type { PurchaseAttachment } from '@/utils/purchase/types';

export type EvidenceFileCategory =
  | 'receipts'
  | 'invoices'
  | 'others'
  | (string & {});

export interface EvidenceFile extends PurchaseAttachment {
  id?: string;
  name?: string;
  type?: EvidenceFileCategory;
  url?: string;
  file?: File;
  isLocal?: boolean;
  preview?: string | null;
}

export interface EvidenceImageSlide {
  src: string;
  title?: string;
  description?: string;
}

export type EvidenceFileInput = Required<Pick<EvidenceFile, 'id' | 'name'>> &
  EvidenceFile;
