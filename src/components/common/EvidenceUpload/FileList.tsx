import SharedFileList from '../fileUploadShared/components/FileList';
import type { EvidenceFile } from './types';

interface FileListProps {
  files?: EvidenceFile[];
  removeFile?: (fileId: string) => void;
  handlePreview?: (file: EvidenceFile) => void;
}

const EMPTY_EVIDENCE_FILES: EvidenceFile[] = [];
const EVIDENCE_FILE_TYPE_LABELS: Record<string, string> = {
  receipts: 'Recibos',
  invoices: 'Facturas',
  others: 'Otros Documentos',
};
const EVIDENCE_FILE_GROUPS = new Set(['receipts', 'invoices', 'others']);

const getEvidenceGroupType = (file: EvidenceFile) => {
  const type = file.type?.toLowerCase() ?? '';
  return EVIDENCE_FILE_GROUPS.has(type) ? type : 'others';
};

const getEvidenceRemoveFileId = (file: EvidenceFile) =>
  file.id ?? file.url ?? file.name;

const FileList = ({
  files = EMPTY_EVIDENCE_FILES,
  removeFile,
  handlePreview,
}: FileListProps) => (
  <SharedFileList<EvidenceFile>
    files={files}
    removeFile={removeFile}
    handlePreview={handlePreview}
    fileTypeLabels={EVIDENCE_FILE_TYPE_LABELS}
    getGroupType={getEvidenceGroupType}
    getRemoveFileId={getEvidenceRemoveFileId}
  />
);

export default FileList;
