import { message } from 'antd';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ChangeEvent, DragEvent as ReactDragEvent } from 'react';

import {
  getLocalURL,
  revokeLocalURL,
  isImageFile,
  isPDFFile,
  getFileTypeFromUrl,
} from '@/utils/fileUtils';

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

const EvidenceUpload = ({
  files = [],
  attachmentUrls = [],
  onAddFiles,
  onRemoveFiles,
  showFileList = true,
}: EvidenceUploadProps) => {
  const [fileType, setFileType] = useState<EvidenceFileCategory>('receipts');
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const handleDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      if (e.relatedTarget === null) {
        setIsDragging(false);
      }
    };

    window.addEventListener(
      'dragenter',
      handleDragEnter as unknown as EventListener,
    );
    window.addEventListener(
      'dragleave',
      handleDragLeave as unknown as EventListener,
    );

    return () => {
      window.removeEventListener(
        'dragenter',
        handleDragEnter as unknown as EventListener,
      );
      window.removeEventListener(
        'dragleave',
        handleDragLeave as unknown as EventListener,
      );
    };
  }, []);

  const handleDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

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
        setLightboxIndex(Math.max(0, index));
        setLightboxOpen(true);
      } else if (isPDF) {
        setPreviewFile(file);
        setPreviewVisible(true);
      }
    },
    [getImageFiles],
  );

  return (
    <div>
      {onAddFiles && (
        <FileUploadControls
          fileType={fileType}
          setFileType={setFileType}
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
        setPreviewVisible={setPreviewVisible}
        setPreviewFile={setPreviewFile}
      />

      <ImageLightbox
        lightboxOpen={lightboxOpen}
        setLightboxOpen={setLightboxOpen}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
        getImageFiles={getImageFiles}
      />

      <DragOverlay
        isDragging={isDragging}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e: any) => {
          e.preventDefault();
          if (e.relatedTarget === null) {
            setIsDragging(false);
          }
        }}
        fileType={fileType}
      />
    </div>
  );
};

export default EvidenceUpload;
