import type { PurchaseAttachment } from '@/utils/purchase/types';

import type {
  LightboxSlide,
  PreviewableFile,
} from '../fileUploadShared/types';

export type EvidenceFileCategory =
  | 'receipts'
  | 'invoices'
  | 'others'
  | (string & {});

export interface EvidenceFile extends PurchaseAttachment, PreviewableFile {
  id?: string;
  name?: string;
  type?: EvidenceFileCategory;
  url?: string;
  file?: File;
  isLocal?: boolean;
  preview?: string | null;
}

export type EvidenceImageSlide = LightboxSlide;

export type EvidenceFileInput = Required<Pick<EvidenceFile, 'id' | 'name'>> &
  EvidenceFile;
