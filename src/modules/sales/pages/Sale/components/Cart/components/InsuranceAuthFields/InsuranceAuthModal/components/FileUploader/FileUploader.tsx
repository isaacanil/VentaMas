import { FileOutlined } from '@/constants/icons/antd';
import { message, Badge, Button } from 'antd';
import { useCallback, useState } from 'react';

import type { PreviewableFile } from '@/components/common/fileUploadShared/types';
import FileList from '@/components/common/fileUploadShared/components/FileList';
import FileListDrawer from './FileListDrawer';
import FileUploadControls from '@/components/common/fileUploadShared/components/FileUploadControls';
import FileUploadRuntimeLayer from '@/components/common/fileUploadShared/components/FileUploadRuntimeLayer';
import useFileUploadController from '@/components/common/fileUploadShared/hooks/useFileUploadController';
import type {
  CreateLocalUploadFileContext,
  NormalizeLocalPreviewFileContext,
} from '@/components/common/fileUploadShared/hooks/useFileUploadController';

type FileTypeKey = string;

type FileLike = File | { name?: string };

type FileUploaderLocalFileInput = {
  id?: string;
  name?: string;
  type?: FileTypeKey;
  file?: FileLike;
};

type FileUploaderRemoteFileInput = {
  id?: string;
  name?: string;
  type?: FileTypeKey;
  url?: string;
};

type FileUploaderLocalFile = {
  id: string;
  name: string;
  type: FileTypeKey;
  file: File;
  isLocal: true;
};

type FileUploaderListItem = PreviewableFile & {
  id?: string;
  name: string;
  type: FileTypeKey;
  file?: File;
  url?: string;
  isLocal: boolean;
};

type FileUploaderProps = {
  files?: FileUploaderLocalFileInput[];
  attachmentUrls?: FileUploaderRemoteFileInput[];
  onAddFiles?: ((files: FileUploaderLocalFile[]) => void) | null;
  onRemoveFiles?: ((fileId: string) => void) | null;
  showFileList?: boolean;
  defaultFileType?: FileTypeKey;
  fileTypes?: FileTypeKey[];
  fileTypeLabels?: Record<string, string>;
  maxFiles?: number | null;
  acceptedFileTypes?: string | null;
  uploaderTitle?: string;
  successMessage?: string;
  errorMaxFilesMessage?: string;
  errorFileTypeMessage?: string;
  compact?: boolean;
  alwaysShowTypeSelector?: boolean;
  inlineLayout?: boolean;
};

const EMPTY_FILES: FileUploaderLocalFileInput[] = [];
const EMPTY_ATTACHMENTS: FileUploaderRemoteFileInput[] = [];
const DEFAULT_FILE_TYPES: FileTypeKey[] = ['document'];
const DEFAULT_FILE_TYPE_LABELS: Record<string, string> = {
  document: 'Documento',
};

const isBrowserFile = (value: unknown): value is File => value instanceof File;

const resolveFileName = (file: FileUploaderLocalFileInput): string => {
  if (file.name) return file.name;
  if (isBrowserFile(file.file)) return file.file.name;
  const fallbackName =
    file.file && typeof file.file === 'object' && 'name' in file.file
      ? String((file.file as { name?: string }).name || '')
      : '';
  return fallbackName || 'Archivo sin nombre';
};

const createFileUploaderUploadFile = (
  file: File,
  { fileType, id }: CreateLocalUploadFileContext<FileTypeKey>,
): FileUploaderLocalFile => ({
  file,
  type: fileType,
  id,
  name: file.name,
  isLocal: true,
});

const normalizeFileUploaderPreviewFile = (
  file: FileUploaderLocalFileInput,
  { defaultFileType, getLocalURL }: NormalizeLocalPreviewFileContext<FileTypeKey>,
): FileUploaderListItem => {
  const resolvedName = resolveFileName(file);
  const browserFile = isBrowserFile(file.file) ? file.file : undefined;

  return {
    ...file,
    name: resolvedName,
    type: file.type || defaultFileType,
    isLocal: true,
    preview: browserFile ? getLocalURL(browserFile) : null,
    file: browserFile,
  };
};

/**
 * Componente FileUploader - Un uploader de archivos general y reutilizable
 *
 * @param {Array} files - Lista de archivos locales ya subidos
 * @param {Array} attachmentUrls - Lista de archivos remotos ya guardados
 * @param {Function} onAddFiles - Función a llamar cuando se agregan archivos
 * @param {Function} onRemoveFiles - Función a llamar cuando se eliminan archivos
 * @param {Boolean} showFileList - Indica si se debe mostrar la lista de archivos
 * @param {String} defaultFileType - Tipo de archivo predeterminado
 * @param {Array} fileTypes - Lista de tipos de archivos disponibles
 * @param {Object} fileTypeLabels - Mapeo de tipos de archivo a etiquetas para mostrar
 * @param {Number} maxFiles - Número máximo de archivos permitidos (opcional)
 * @param {String} acceptedFileTypes - String con los tipos de archivo permitidos (ej: ".jpg,.png,.pdf")
 * @param {String} uploaderTitle - Título del uploader
 * @param {String} successMessage - Mensaje de éxito personalizado
 * @param {String} errorMaxFilesMessage - Mensaje de error de máximo de archivos personalizado
 * @param {String} errorFileTypeMessage - Mensaje de error de tipo de archivo personalizado
 * @param {Boolean} compact - Si es true, muestra la lista de archivos en modo compacto (drawer)
 * @param {Boolean} alwaysShowTypeSelector - Si es true, siempre muestra el selector de tipo aunque solo haya uno
 * @param {Boolean} inlineLayout - Si es true, muestra los controles en una sola línea sin etiquetas
 */
const FileUploader = ({
  files = EMPTY_FILES,
  attachmentUrls = EMPTY_ATTACHMENTS,
  onAddFiles = null,
  onRemoveFiles = null,
  showFileList = true,
  defaultFileType = 'document',
  fileTypes = DEFAULT_FILE_TYPES,
  fileTypeLabels = DEFAULT_FILE_TYPE_LABELS,
  maxFiles = null,
  acceptedFileTypes = null,
  uploaderTitle = 'Subir archivos',
  successMessage = '{count} archivo(s) agregado(s)',
  errorMaxFilesMessage = 'Solo puede subir un máximo de {max} archivos',
  errorFileTypeMessage = 'Tipo(s) de archivo no permitido(s): {files}',
  compact = false,
  alwaysShowTypeSelector = false,
  inlineLayout = false,
}: FileUploaderProps) => {
  const [fileListDrawerOpen, setFileListDrawerOpen] = useState(false);
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
    FileUploaderLocalFileInput,
    FileUploaderRemoteFileInput,
    FileUploaderListItem,
    FileUploaderLocalFile
  >({
    files,
    attachmentUrls,
    defaultFileType,
    onAddFiles,
    onRemoveFiles,
    maxFiles,
    acceptedFileTypes,
    successMessage,
    errorMaxFilesMessage,
    errorFileTypeMessage,
    notifySuccess: (text) => message.success(text),
    notifyError: (text) => message.error(text),
    createLocalUploadFile: createFileUploaderUploadFile,
    normalizeLocalPreviewFile: normalizeFileUploaderPreviewFile,
  });

  const handleOpenDrawer = useCallback(() => {
    setFileListDrawerOpen(true);
  }, []);

  const fileListContent = !showFileList ? null : compact ? (
    <FileListDrawer
      open={fileListDrawerOpen}
      onClose={() => setFileListDrawerOpen(false)}
      files={allFiles}
      removeFile={onRemoveFiles ? handleRemoveFile : null}
      handlePreview={handlePreview}
      fileTypeLabels={fileTypeLabels}
      title={`${allFiles.length} Archivo${allFiles.length !== 1 ? 's' : ''} adjunto${allFiles.length !== 1 ? 's' : ''}`}
    />
  ) : (
    <FileList
      files={allFiles}
      removeFile={onRemoveFiles ? handleRemoveFile : null}
      handlePreview={handlePreview}
      fileTypeLabels={fileTypeLabels}
    />
  );

  const fileCountButton =
    compact && showFileList ? (
      <Badge count={allFiles.length} style={{ marginLeft: '8px' }}>
        <Button
          icon={<FileOutlined />}
          onClick={handleOpenDrawer}
          disabled={allFiles.length === 0}
        >
          Ver archivos
        </Button>
      </Badge>
    ) : null;

  return (
    <div
      style={
        inlineLayout
          ? {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }
          : {}
      }
    >
      {onAddFiles && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
          <FileUploadControls
            fileType={fileType}
            setFileType={setFileType}
            handleFileInput={handleFileInput}
            fileTypes={fileTypes}
            fileTypeLabels={fileTypeLabels}
            title={uploaderTitle}
            acceptedFileTypes={acceptedFileTypes}
            compact={compact || inlineLayout}
            alwaysShowTypeSelector={alwaysShowTypeSelector}
          />
          {fileCountButton}
        </div>
      )}

      {fileListContent}

      <FileUploadRuntimeLayer<FileUploaderListItem>
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

export default FileUploader;
