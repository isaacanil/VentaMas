import { Drawer } from 'antd';
import React from 'react';

import FileList from './FileList';

/**
 * Componente para mostrar la lista de archivos en un drawer
 * para el modo compacto del FileUploader
 */
const FileListDrawer = ({
  open,
  onClose,
  files,
  removeFile,
  handlePreview,
  fileTypeLabels,
  title = 'Archivos adjuntos',
}) => {
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
