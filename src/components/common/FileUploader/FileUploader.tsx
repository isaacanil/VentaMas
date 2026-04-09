import { FileOutlined } from '@/constants/icons/antd';
import { message, Badge, Button } from 'antd';
import React, { useReducer, useEffect, useMemo, useCallback } from 'react';

import {
  getLocalURL,
  revokeLocalURL,
  isImageFile,
  isPDFFile,
  getFileTypeFromUrl,
} from '@/utils/fileUtils';

import useGlobalFileDragOverlay from '../fileUploadShared/hooks/useGlobalFileDragOverlay';
import DragOverlay from './DragOverlay';
import FileList from './FileList';
import FileListDrawer from './FileListDrawer';
import FileUploadControls from './FileUploadControls';
import ImageLightbox from './ImageLightbox';
import PreviewContent from './PreviewContent';

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

type FileUploaderRemoteFile = {
  id: string;
  name: string;
  type: FileTypeKey;
  url: string;
  isLocal: false;
};

type FileUploaderListItem = (FileUploaderLocalFile | FileUploaderRemoteFile) & {
  preview?: string | null;
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

interface FileUploaderUiState {
  fileType: FileTypeKey;
  isDragging: boolean;
  previewFile: FileUploaderListItem | null;
  previewVisible: boolean;
  lightboxOpen: boolean;
  lightboxIndex: number;
  fileListDrawerOpen: boolean;
}

type FileUploaderUiAction =
  | { type: 'setFileType'; fileType: FileTypeKey }
  | { type: 'setDragging'; value: boolean }
  | { type: 'openPreview'; file: FileUploaderListItem }
  | { type: 'setPreviewVisible'; value: boolean }
  | { type: 'setPreviewFile'; file: FileUploaderListItem | null }
  | { type: 'openLightbox'; index: number }
  | { type: 'setLightboxOpen'; value: boolean }
  | { type: 'setLightboxIndex'; index: number }
  | { type: 'setFileListDrawerOpen'; value: boolean };

const EMPTY_FILES: FileUploaderLocalFileInput[] = [];
const EMPTY_ATTACHMENTS: FileUploaderRemoteFileInput[] = [];
const DEFAULT_FILE_TYPES: FileTypeKey[] = ['document'];
const DEFAULT_FILE_TYPE_LABELS: Record<string, string> = {
  document: 'Documento',
};

const isBrowserFile = (value: unknown): value is File => value instanceof File;

const createInitialFileUploaderUiState = (
  defaultFileType: FileTypeKey,
): FileUploaderUiState => ({
  fileType: defaultFileType,
  isDragging: false,
  previewFile: null,
  previewVisible: false,
  lightboxOpen: false,
  lightboxIndex: 0,
  fileListDrawerOpen: false,
});

const fileUploaderUiReducer = (
  state: FileUploaderUiState,
  action: FileUploaderUiAction,
): FileUploaderUiState => {
  switch (action.type) {
    case 'setFileType':
      return { ...state, fileType: action.fileType };
    case 'setDragging':
      return { ...state, isDragging: action.value };
    case 'openPreview':
      return {
        ...state,
        previewFile: action.file,
        previewVisible: true,
      };
    case 'setPreviewVisible':
      return { ...state, previewVisible: action.value };
    case 'setPreviewFile':
      return { ...state, previewFile: action.file };
    case 'openLightbox':
      return {
        ...state,
        lightboxIndex: action.index,
        lightboxOpen: true,
      };
    case 'setLightboxOpen':
      return { ...state, lightboxOpen: action.value };
    case 'setLightboxIndex':
      return { ...state, lightboxIndex: action.index };
    case 'setFileListDrawerOpen':
      return { ...state, fileListDrawerOpen: action.value };
    default:
      return state;
  }
};

const isRemoteFile = (
  value: FileUploaderListItem,
): value is FileUploaderRemoteFile & { preview?: string | null } =>
  value.isLocal === false;

const resolveFileName = (file: FileUploaderLocalFileInput): string => {
  if (file.name) return file.name;
  if (isBrowserFile(file.file)) return file.file.name;
  const fallbackName =
    file.file && typeof file.file === 'object' && 'name' in file.file
      ? String((file.file as { name?: string }).name || '')
      : '';
  return fallbackName || 'Archivo sin nombre';
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
  const [uiState, dispatchUi] = useReducer(
    fileUploaderUiReducer,
    defaultFileType,
    createInitialFileUploaderUiState,
  );
  const {
    fileType,
    isDragging,
    previewFile,
    previewVisible,
    lightboxOpen,
    lightboxIndex,
    fileListDrawerOpen,
  } = uiState;

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Verificar límite de archivos si existe
    if (maxFiles && files.length + newFiles.length > maxFiles) {
      message.error(errorMaxFilesMessage.replace('{max}', String(maxFiles)));
      return;
    }

    // Verificar tipos de archivo aceptados si existe la restricción
    if (acceptedFileTypes) {
      const validExtensions = acceptedFileTypes.split(',');
      const invalidFiles = newFiles.filter((file) => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return !validExtensions.includes(extension);
      });

      if (invalidFiles.length > 0) {
        message.error(
          errorFileTypeMessage.replace(
            '{files}',
            invalidFiles.map((f) => f.name).join(', '),
          ),
        );

        // Filtrar solo archivos válidos
        newFiles = newFiles.filter((file) => {
          const extension = '.' + file.name.split('.').pop().toLowerCase();
          return validExtensions.includes(extension);
        });

        if (newFiles.length === 0) return;
      }
    }

    const filesWithType: FileUploaderLocalFile[] = newFiles.map((file) => ({
      file,
      type: fileType,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      isLocal: true,
    }));

    if (onAddFiles) {
      onAddFiles(filesWithType);
      message.success(successMessage.replace('{count}', String(newFiles.length)));
    }
  };

  const setDragging = useCallback((value: boolean) => {
    dispatchUi({ type: 'setDragging', value });
  }, []);

  const { handleDrop, handleDragOver, handleDragLeave } =
    useGlobalFileDragOverlay({
      setDragging,
      onFilesDrop: addFiles,
    });

  const handleRemoveFile = (fileId: string) => {
    if (onRemoveFiles) {
      onRemoveFiles(fileId);
    }
  };

  const getImageFiles = useCallback(() => {
    const imageFiles = [];

    // Archivos locales
    files.forEach((file) => {
      const fileName = resolveFileName(file);
      if (isImageFile(fileName)) {
        if (!isBrowserFile(file.file)) return;
        imageFiles.push({
          src: getLocalURL(file.file),
          title: fileName,
          description: `Tipo: ${file.type}`,
        });
      }
    });

    // Solo archivos remotos de Firebase
    attachmentUrls
      .filter((file) => file.url?.includes('firebasestorage.googleapis.com'))
      .forEach((file) => {
        const fileName = file.name ?? 'Archivo sin nombre';
        if (isImageFile(fileName)) {
          imageFiles.push({
            src: file.url ?? '',
            title: fileName,
            description: `Tipo: ${file.type}`,
          });
        }
      });

    return imageFiles;
  }, [files, attachmentUrls]);

  const allFiles = useMemo(() => {
    // Solo mapeamos los archivos locales con su vista previa
    const localFiles = (files || []).map((file) => {
      const resolvedName = resolveFileName(file);
      const preview = isBrowserFile(file.file) ? getLocalURL(file.file) : null;
      return {
        ...file,
        name: resolvedName,
        isLocal: true,
        preview,
        file: isBrowserFile(file.file) ? file.file : undefined,
      };
    });

    // Solo incluimos archivos remotos que ya están en Firebase
    const remoteFiles = (attachmentUrls || [])
      .filter((attachment) =>
        attachment.url?.includes('firebasestorage.googleapis.com'),
      )
      .map((attachment, index) => ({
        id:
          attachment.id ||
          attachment.url ||
          `${attachment.name || 'attachment'}-${index}`,
        name: attachment.name || 'Archivo sin nombre',
        type: attachment.type || getFileTypeFromUrl(attachment.url || ''),
        url: attachment.url,
        isLocal: false,
        preview: null,
      }));

    return [...localFiles, ...remoteFiles];
  }, [files, attachmentUrls]);

  useEffect(() => {
    // Cleanup URLs when component unmounts
    return () => {
      allFiles
        .filter((file) => file.isLocal && file.preview)
        .forEach((file) => {
          revokeLocalURL(file.preview);
        });
    };
  }, [allFiles]);

  const handlePreview = useCallback(
    (file: FileUploaderListItem) => {
      if (!file) return;

      const fileName = file.name || '';
      const isImage = isImageFile(fileName);
      const isPDF = isPDFFile(fileName);

      if (isImage) {
        const images = getImageFiles();
        const localUrl = file.isLocal ? getLocalURL(file.file) : null;
        let resolvedUrl = '';
        if (isRemoteFile(file)) {
          resolvedUrl = file.url || '';
        } else {
          resolvedUrl = localUrl || '';
        }
        const index = images.findIndex(
          (img) => img.title === fileName && img.src === resolvedUrl,
        );
        dispatchUi({ type: 'openLightbox', index: Math.max(0, index) });
      } else if (isPDF) {
        dispatchUi({ type: 'openPreview', file });
      }
    },
    [getImageFiles],
  );

  const handleOpenDrawer = useCallback(() => {
    dispatchUi({ type: 'setFileListDrawerOpen', value: true });
  }, []);

  const setPreviewVisibleState = useCallback((value: boolean) => {
    dispatchUi({ type: 'setPreviewVisible', value });
  }, []);

  const setPreviewFileState = useCallback<
    React.Dispatch<React.SetStateAction<FileUploaderListItem | null>>
  >((nextValue) => {
    const value =
      typeof nextValue === 'function' ? nextValue(uiState.previewFile) : nextValue;
    dispatchUi({ type: 'setPreviewFile', file: value });
  }, [uiState.previewFile]);

  const setLightboxOpenState = useCallback((value: boolean) => {
    dispatchUi({ type: 'setLightboxOpen', value });
  }, []);

  const setLightboxIndexState = useCallback((index: number) => {
    dispatchUi({ type: 'setLightboxIndex', index });
  }, []);

  const fileListContent = !showFileList ? null : compact ? (
    <FileListDrawer
      open={fileListDrawerOpen}
      onClose={() =>
        dispatchUi({ type: 'setFileListDrawerOpen', value: false })
      }
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
            setFileType={(value) =>
              dispatchUi({ type: 'setFileType', fileType: value })
            }
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

      <PreviewContent
        previewFile={previewFile}
        previewVisible={previewVisible}
        setPreviewVisible={setPreviewVisibleState}
        setPreviewFile={setPreviewFileState}
      />

      <ImageLightbox
        lightboxOpen={lightboxOpen}
        setLightboxOpen={setLightboxOpenState}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndexState}
        getImageFiles={getImageFiles}
      />

      <DragOverlay
        isDragging={isDragging}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        fileType={fileType}
      />
    </div>
  );
};

export default FileUploader;
