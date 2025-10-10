import { FileOutlined } from '@ant-design/icons';
import { message, Badge, Button } from 'antd';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
  getLocalURL,
  revokeLocalURL,
  isImageFile,
  isPDFFile,
  getFileTypeFromUrl
} from '../../../utils/fileUtils';

import DragOverlay from './DragOverlay';
import FileList from './FileList';
import FileListDrawer from './FileListDrawer';
import FileUploadControls from './FileUploadControls';
import ImageLightbox from './ImageLightbox';
import PreviewContent from './PreviewContent';


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
  files = [],
  attachmentUrls = [],
  onAddFiles = null,
  onRemoveFiles = null,
  showFileList = true,
  defaultFileType = 'document',
  fileTypes = ['document'],
  fileTypeLabels = {
    document: 'Documento'
  },
  maxFiles = null,
  acceptedFileTypes = null,
  uploaderTitle = 'Subir archivos',
  successMessage = '{count} archivo(s) agregado(s)',
  errorMaxFilesMessage = 'Solo puede subir un máximo de {max} archivos',
  errorFileTypeMessage = 'Tipo(s) de archivo no permitido(s): {files}',
  compact = false,
  alwaysShowTypeSelector = false,
  inlineLayout = false
}) => {
  const [fileType, setFileType] = useState(defaultFileType);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [fileListDrawerOpen, setFileListDrawerOpen] = useState(false);

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
    // Verificar límite de archivos si existe
    if (maxFiles && (files.length + newFiles.length > maxFiles)) {
      message.error(errorMaxFilesMessage.replace('{max}', maxFiles));
      return;
    }

    // Verificar tipos de archivo aceptados si existe la restricción
    if (acceptedFileTypes) {
      const validExtensions = acceptedFileTypes.split(',');
      const invalidFiles = newFiles.filter(file => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return !validExtensions.includes(extension);
      });
      
      if (invalidFiles.length > 0) {
        message.error(errorFileTypeMessage.replace(
          '{files}', 
          invalidFiles.map(f => f.name).join(', ')
        ));
        
        // Filtrar solo archivos válidos
        newFiles = newFiles.filter(file => {
          const extension = '.' + file.name.split('.').pop().toLowerCase();
          return validExtensions.includes(extension);
        });
        
        if (newFiles.length === 0) return;
      }
    }

    const filesWithType = newFiles.map(file => ({
      file,
      type: fileType,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      isLocal: true
    }));
    
    if (onAddFiles) {
      onAddFiles(filesWithType);
      message.success(successMessage.replace('{count}', newFiles.length));
    }
  };

  const handleRemoveFile = (fileId) => {
    if (onRemoveFiles) {
      onRemoveFiles(fileId);
    }
  };

  const getImageFiles = useCallback(() => {
    const imageFiles = [];

    // Archivos locales
    files.forEach(file => {
      if (isImageFile(file.name)) {
        imageFiles.push({
          src: getLocalURL(file.file),
          title: file.name,
          description: `Tipo: ${file.type}`
        });
      }
    });

    // Solo archivos remotos de Firebase
    attachmentUrls
      .filter(file => file.url?.includes('firebasestorage.googleapis.com'))
      .forEach(file => {
        if (isImageFile(file.name)) {
          imageFiles.push({
            src: file.url,
            title: file.name,
            description: `Tipo: ${file.type}`
          });
        }
      });

    return imageFiles;
  }, [files, attachmentUrls]);

  const allFiles = useMemo(() => {
    // Solo mapeamos los archivos locales con su vista previa
    const localFiles = (files || []).map(file => ({
      ...file,
      isLocal: true,
      preview: file.file ? getLocalURL(file.file) : null
    }));

    // Solo incluimos archivos remotos que ya están en Firebase
    const remoteFiles = (attachmentUrls || [])
      .filter(attachment => attachment.url?.includes('firebasestorage.googleapis.com'))
      .map(attachment => ({
        id: attachment.id || Math.random().toString(36).substr(2, 9),
        name: attachment.name || 'Archivo sin nombre',
        type: attachment.type || getFileTypeFromUrl(attachment.url),
        url: attachment.url,
        isLocal: false
      }));

    return [...localFiles, ...remoteFiles];
  }, [files, attachmentUrls]);

  useEffect(() => {
    // Cleanup URLs when component unmounts
    return () => {
      allFiles
        .filter(file => file.isLocal && file.preview)
        .forEach(file => {
          revokeLocalURL(file.preview);
        });
    };
  }, [allFiles]);

  const handlePreview = useCallback((file) => {
    if (!file) return;

    const isImage = isImageFile(file.name);
    const isPDF = isPDFFile(file.name);

    if (isImage) {
      const images = getImageFiles();
      const index = images.findIndex(img =>
        img.title === file.name &&
        img.src === (file.url || (file.file && getLocalURL(file.file)))
      );
      setLightboxIndex(Math.max(0, index));
      setLightboxOpen(true);
    } else if (isPDF) {
      setPreviewFile(file);
      setPreviewVisible(true);
    }
  }, [getImageFiles]);

  // Renderizado condicional basado en la prop compact
  const renderFileList = () => {
    if (!showFileList) return null;
    
    if (compact) {
      return (
        <FileListDrawer
          open={fileListDrawerOpen} 
          onClose={() => setFileListDrawerOpen(false)}
          files={allFiles}
          removeFile={onRemoveFiles ? handleRemoveFile : null}
          handlePreview={handlePreview}
          fileTypeLabels={fileTypeLabels}
          title={`${allFiles.length} Archivo${allFiles.length !== 1 ? 's' : ''} adjunto${allFiles.length !== 1 ? 's' : ''}`}
        />
      );
    }
    
    return (
      <FileList
        files={allFiles}
        removeFile={onRemoveFiles ? handleRemoveFile : null}
        handlePreview={handlePreview}
        fileTypeLabels={fileTypeLabels}
      />
    );
  };

  const renderFileCountButton = () => {
    if (!compact || !showFileList) return null;
      const fileCount = allFiles.length;
    const handleOpenDrawer = () => {
      setFileListDrawerOpen(true);
    };

    return (
      <Badge count={fileCount} style={{ marginLeft: 8 }}>
        <Button 
          icon={<FileOutlined />} 
          onClick={handleOpenDrawer}
          disabled={fileCount === 0}
        >
          Ver archivos
        </Button>
      </Badge>
    );
  };

  return (
    <div style={inlineLayout ? { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' } : {}}>
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
          {renderFileCountButton()}
        </div>
      )}

      {renderFileList()}

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
        onDragOver={e => e.preventDefault()}
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

export default FileUploader;