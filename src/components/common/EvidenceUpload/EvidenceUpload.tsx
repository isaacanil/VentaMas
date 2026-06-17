import { message } from 'antd';

import {
  FileList,
  FileUploadControls,
  FileUploadRuntimeLayer,
  useFileUploadController,
  type CreateLocalUploadFileContext,
  type NormalizeLocalPreviewFileContext,
} from '../fileUploadShared';
import {
  EVIDENCE_FILE_TYPES,
  EVIDENCE_FILE_TYPE_LABELS,
  EVIDENCE_FILE_TYPE_SELECTOR_LABELS,
  getEvidenceGroupType,
  getEvidenceRemoveFileId,
} from './evidenceFileConfig';
import type {
  EvidenceFile,
  EvidenceFileCategory,
  EvidenceFileInput,
} from './types';

interface EvidenceUploadProps {
  files?: EvidenceFile[];
  attachmentUrls?: EvidenceFile[];
  onAddFiles?: (files: EvidenceFileInput[]) => void;
  onRemoveFiles?: (fileId: string) => void;
  showFileList?: boolean;
}

const EMPTY_EVIDENCE_FILES: EvidenceFile[] = [];

const createEvidenceUploadFile = (
  file: File,
  { fileType, id }: CreateLocalUploadFileContext<EvidenceFileCategory>,
): EvidenceFileInput => ({
  file,
  type: fileType,
  id,
  name: file.name,
  isLocal: true,
});

const normalizeEvidencePreviewFile = (
  file: EvidenceFile,
  { getLocalURL }: NormalizeLocalPreviewFileContext<EvidenceFileCategory>,
): EvidenceFile => ({
  ...file,
  isLocal: true,
  preview: file.file ? getLocalURL(file.file) : null,
});

const EvidenceUpload = ({
  files = EMPTY_EVIDENCE_FILES,
  attachmentUrls = EMPTY_EVIDENCE_FILES,
  onAddFiles,
  onRemoveFiles,
  showFileList = true,
}: EvidenceUploadProps) => {
  const {
    fileType,
    setFileType,
    isDragging,
    previewFile,
    previewVisible,
    lightboxOpen,
    lightboxIndex,
    allFiles,
    imageSlides,
    handleFileInput,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleRemoveFile,
    handlePreview,
    setPreviewVisible,
    setPreviewFile,
    setLightboxOpen,
    setLightboxIndex,
  } = useFileUploadController<
    EvidenceFile,
    EvidenceFile,
    EvidenceFile,
    EvidenceFileInput,
    EvidenceFileCategory
  >({
    files,
    attachmentUrls,
    defaultFileType: 'receipts',
    onAddFiles: onAddFiles ?? null,
    onRemoveFiles: onRemoveFiles ?? null,
    successMessage: '{count} archivo(s) agregado(s)',
    notifySuccess: (text) => message.success(text),
    createLocalUploadFile: createEvidenceUploadFile,
    normalizeLocalPreviewFile: normalizeEvidencePreviewFile,
  });

  return (
    <div>
      {onAddFiles && (
        <FileUploadControls
          fileType={fileType}
          setFileType={setFileType}
          handleFileInput={handleFileInput}
          fileTypes={EVIDENCE_FILE_TYPES}
          fileTypeLabels={EVIDENCE_FILE_TYPE_SELECTOR_LABELS}
          title="Adjuntar Evidencia"
          typeSelectorLabel="Tipo"
        />
      )}

      {showFileList && (
        <FileList<EvidenceFile>
          files={allFiles}
          removeFile={onRemoveFiles ? handleRemoveFile : undefined}
          handlePreview={handlePreview}
          fileTypeLabels={EVIDENCE_FILE_TYPE_LABELS}
          getGroupType={getEvidenceGroupType}
          getRemoveFileId={getEvidenceRemoveFileId}
        />
      )}

      <FileUploadRuntimeLayer<EvidenceFile>
        fileType={fileType}
        imageSlides={imageSlides}
        isDragging={isDragging}
        lightboxIndex={lightboxIndex}
        lightboxOpen={lightboxOpen}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        previewFile={previewFile}
        previewVisible={previewVisible}
        setLightboxIndex={setLightboxIndex}
        setLightboxOpen={setLightboxOpen}
        setPreviewFile={setPreviewFile}
        setPreviewVisible={setPreviewVisible}
      />
    </div>
  );
};

export default EvidenceUpload;
