import type { UploadFile } from 'antd';

import type { ImportOptions } from '../../types';

export type { ImportOptions } from '../../types';

export type ImportLanguage = 'es' | 'en';

export type ImportModalProps = {
  open: boolean;
  onClose: () => void;
  onImport: (file: File, options?: ImportOptions) => Promise<unknown>;
  onCreateTemplate: (
    language: ImportLanguage,
    fields: string[],
  ) => Promise<void>;
};

export type PreviewRow = Record<string, unknown> & {
  key: number;
};

export interface ImportModalUiState {
  activeTab: 'import' | 'template';
  fileList: UploadFile[];
  isImporting: boolean;
  isPreviewing: boolean;
  previewData: unknown[];
  selectedOptionalFields: string[];
}

export type ImportModalUiAction =
  | { type: 'patch'; patch: Partial<ImportModalUiState> }
  | { type: 'resetImportState' };
