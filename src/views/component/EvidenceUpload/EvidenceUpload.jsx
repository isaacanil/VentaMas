import { message } from 'antd';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

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

const EvidenceUpload = ({
  files = [],
  attachmentUrls = [],
  onAddFiles = null,
  onRemoveFiles = null,
  showFileList = true,
}) => {
  const [fileType, setFileType] = useState('receipts');
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      if (e.relatedTarget === null) {
        setIsDragging(false);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
    };
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const filesWithType = newFiles.map((file) => ({
      file,
      type: fileType,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      isLocal: true, // Agregamos esta bandera para identificar archivos locales
    }));
    onAddFiles(filesWithType);
    message.success(`${newFiles.length} archivo(s) agregado(s)`);
  };

  const handleRemoveFile = (fileId) => {
    onRemoveFiles(fileId);
  };

  const getImageFiles = useCallback(() => {
    const imageFiles = [];

    // Archivos locales
    files.forEach((file) => {
      if (isImageFile(file.name)) {
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
        if (isImageFile(file.name)) {
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
    const localFiles = (files || []).map((file) => ({
      ...file,
      isLocal: true,
      preview: file.file ? getLocalURL(file.file) : null,
    }));

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
        type: attachment.type || getFileTypeFromUrl(attachment.url),
        url: attachment.url,
        isLocal: false,
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
    (file) => {
      if (!file) return;

      const isImage = isImageFile(file.name);
      const isPDF = isPDFFile(file.name);

      if (isImage) {
        const images = getImageFiles();
        const index = images.findIndex(
          (img) =>
            img.title === file.name &&
            img.src === (file.url || (file.file && getLocalURL(file.file))),
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
          removeFile={onRemoveFiles ? handleRemoveFile : null}
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
        onDragLeave={(e) => {
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
