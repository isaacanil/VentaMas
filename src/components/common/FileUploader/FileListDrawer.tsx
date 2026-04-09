import { Drawer } from 'antd';
import React from 'react';

import FileList from './FileList';

/**
 * Componente para mostrar la lista de archivos en un drawer
 * para el modo compacto del FileUploader
 */
type FileListItem = {
  id?: string;
  url?: string;
  name: string;
  type?: string;
  file?: File;
  preview?: string | null;
};

type FileListDrawerProps = {
  open: boolean;
  onClose: () => void;
  files?: FileListItem[];
  removeFile?: (fileId: string) => void;
  handlePreview?: (file: FileListItem) => void;
  fileTypeLabels?: Record<string, string>;
  title?: string;
};

const FileListDrawer = ({
  open,
  onClose,
  files,
  removeFile,
  handlePreview,
  fileTypeLabels,
  title = 'Archivos adjuntos',
}: FileListDrawerProps) => {
  return (
    <Drawer
      title={title}
      placement="bottom"
      onClose={onClose}
      open={open}
      width={520}
    >
      <FileList
        files={files}
        removeFile={removeFile}
        handlePreview={handlePreview}
        fileTypeLabels={fileTypeLabels}
      />
    </Drawer>
  );
};

export default FileListDrawer;
