import { message } from 'antd';
import { useReducer, useEffect, useMemo, useCallback } from 'react';
import type { ChangeEvent } from 'react';

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
import FileUploadControls from './FileUploadControls';
import ImageLightbox from './ImageLightbox';
import PreviewContent from './PreviewContent';
import type {
  EvidenceFile,
  EvidenceFileCategory,
  EvidenceFileInput,
  EvidenceImageSlide,
} from './types';

interface EvidenceUploadProps {
  files?: EvidenceFile[];
  attachmentUrls?: EvidenceFile[];
  onAddFiles?: (files: EvidenceFileInput[]) => void;
  onRemoveFiles?: (fileId: string) => void;
  showFileList?: boolean;
}

const EMPTY_EVIDENCE_FILES: EvidenceFile[] = [];

interface EvidenceUploadUiState {
  fileType: EvidenceFileCategory;
  isDragging: boolean;
  previewFile: EvidenceFile | null;
  previewVisible: boolean;
  lightboxOpen: boolean;
  lightboxIndex: number;
}

type EvidenceUploadUiAction =
  | { type: 'setFileType'; fileType: EvidenceFileCategory }
  | { type: 'setDragging'; value: boolean }
  | { type: 'openPreview'; file: EvidenceFile }
  | { type: 'setPreviewVisible'; value: boolean }
  | { type: 'setPreviewFile'; file: EvidenceFile | null }
  | { type: 'openLightbox'; index: number }
  | { type: 'setLightboxOpen'; value: boolean }
  | { type: 'setLightboxIndex'; index: number };

const initialEvidenceUploadUiState: EvidenceUploadUiState = {
  fileType: 'receipts',
  isDragging: false,
  previewFile: null,
  previewVisible: false,
  lightboxOpen: false,
  lightboxIndex: 0,
};

const evidenceUploadUiReducer = (
  state: EvidenceUploadUiState,
  action: EvidenceUploadUiAction,
): EvidenceUploadUiState => {
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
        lightboxOpen: true,
        lightboxIndex: action.index,
      };
    case 'setLightboxOpen':
      return { ...state, lightboxOpen: action.value };
    case 'setLightboxIndex':
      return { ...state, lightboxIndex: action.index };
    default:
      return state;
  }
};

const EvidenceUpload = ({
  files = EMPTY_EVIDENCE_FILES,
  attachmentUrls = EMPTY_EVIDENCE_FILES,
  onAddFiles,
  onRemoveFiles,
  showFileList = true,
}: EvidenceUploadProps) => {
  const [uiState, dispatchUi] = useReducer(
    evidenceUploadUiReducer,
    initialEvidenceUploadUiState,
  );
  const {
    fileType,
    isDragging,
    previewFile,
    previewVisible,
    lightboxOpen,
    lightboxIndex,
  } = uiState;

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    if (!onAddFiles) return;

    const filesWithType: EvidenceFileInput[] = newFiles.map((file) => ({
      file,
      type: fileType,
      id: Math.random().toString(36).slice(2, 11),
      name: file.name,
      isLocal: true, // Bandera para identificar archivos locales
    }));
    onAddFiles(filesWithType);
    message.success(`${newFiles.length} archivo(s) agregado(s)`);
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
    onRemoveFiles?.(fileId);
  };

  const getImageFiles = useCallback((): EvidenceImageSlide[] => {
    const imageFiles: EvidenceImageSlide[] = [];

    // Archivos locales
    files.forEach((file) => {
      if (isImageFile(file.name) && file.file) {
        imageFiles.push({
          src: getLocalURL(file.file),
          title: file.name,
          description: `Tipo: ${file.type}`,
        });
      }
    });

    // Solo archivos remotos de Firebase
    attachmentUrls
      .filter((file) => file.url?.includes('firebasestorage.googleapis.com'))
      .forEach((file) => {
        if (isImageFile(file.name) && file.url) {
          imageFiles.push({
            src: file.url,
            title: file.name,
            description: `Tipo: ${file.type}`,
          });
        }
      });

    return imageFiles;
  }, [files, attachmentUrls]);

  const allFiles = useMemo(() => {
    // Solo mapeamos los archivos locales con su vista previa
    const localFiles: EvidenceFile[] = (files || []).map((file) => ({
      ...file,
      isLocal: true,
      preview: file.file ? getLocalURL(file.file) : null,
    }));

    // Solo incluimos archivos remotos que ya están en Firebase
    const remoteFiles: EvidenceFile[] = (attachmentUrls || [])
      .filter((attachment) =>
        attachment.url?.includes('firebasestorage.googleapis.com'),
      )
      .map((attachment, index) => ({
        id:
          attachment.id ||
          attachment.url ||
          `${attachment.name || 'attachment'}-${index}`,
        name: attachment.name || 'Archivo sin nombre',
        type: attachment.type || getFileTypeFromUrl(attachment.url ?? ''),
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
    (file: EvidenceFile) => {
      if (!file) return;

      const isImage = isImageFile(file.name);
      const isPDF = isPDFFile(file.name);

      if (isImage) {
        const images = getImageFiles();
        const index = images.findIndex(
          (img) =>
            img.title === file.name &&
            img.src ===
              (file.url || (file.file ? getLocalURL(file.file) : undefined)),
        );
        dispatchUi({ type: 'openLightbox', index: Math.max(0, index) });
      } else if (isPDF) {
        dispatchUi({ type: 'openPreview', file });
      }
    },
    [getImageFiles],
  );

  const setPreviewVisibleState = useCallback((value: boolean) => {
    dispatchUi({ type: 'setPreviewVisible', value });
  }, []);

  const setPreviewFileState = useCallback((file: EvidenceFile | null) => {
    dispatchUi({ type: 'setPreviewFile', file });
  }, []);

  const setLightboxOpenState = useCallback((value: boolean) => {
    dispatchUi({ type: 'setLightboxOpen', value });
  }, []);

  const setLightboxIndexState = useCallback((value: number) => {
    dispatchUi({ type: 'setLightboxIndex', index: value });
  }, []);

  return (
    <div>
      {onAddFiles && (
        <FileUploadControls
          fileType={fileType}
          setFileType={(value) =>
            dispatchUi({ type: 'setFileType', fileType: value })
          }
          handleFileInput={handleFileInput}
        />
      )}

      {showFileList && (
        <FileList
          files={allFiles}
          removeFile={onRemoveFiles ? handleRemoveFile : undefined}
          handlePreview={handlePreview}
        />
      )}

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

export default EvidenceUpload;
