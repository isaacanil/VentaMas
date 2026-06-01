import type { ChangeEvent } from 'react';

import SharedFileUploadControls from '../fileUploadShared/components/FileUploadControls';
import type { EvidenceFileCategory } from './types';

const EVIDENCE_FILE_TYPES: EvidenceFileCategory[] = [
  'receipts',
  'invoices',
  'others',
];
const EVIDENCE_FILE_TYPE_LABELS: Record<string, string> = {
  receipts: 'Recibos',
  invoices: 'Facturas',
  others: 'Otros',
};

interface FileUploadControlsProps {
  fileType: EvidenceFileCategory;
  setFileType: (value: EvidenceFileCategory) => void;
  handleFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadControls = ({
  fileType,
  setFileType,
  handleFileInput,
}: FileUploadControlsProps) => {
  return (
    <SharedFileUploadControls
      fileType={fileType}
      setFileType={(value) => setFileType(value as EvidenceFileCategory)}
      handleFileInput={handleFileInput}
      fileTypes={EVIDENCE_FILE_TYPES}
      fileTypeLabels={EVIDENCE_FILE_TYPE_LABELS}
      title="Adjuntar Evidencia"
      typeSelectorLabel="Tipo"
    />
  );
};

export default FileUploadControls;
