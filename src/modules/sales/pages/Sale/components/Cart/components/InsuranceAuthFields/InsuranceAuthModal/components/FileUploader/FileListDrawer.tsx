import { Drawer } from 'antd';

import {
  FileList,
  type FileListProps,
  type PreviewableFile,
} from '@/components/common/fileUploadShared';

/**
 * Componente para mostrar la lista de archivos en un drawer
 * para el modo compacto del FileUploader
 */
type FileListDrawerProps<TFile extends PreviewableFile = PreviewableFile> =
  Pick<
    FileListProps<TFile>,
    'fileTypeLabels' | 'files' | 'handlePreview' | 'removeFile'
  > & {
    open: boolean;
    onClose: () => void;
    title?: string;
  };

const FileListDrawer = <TFile extends PreviewableFile = PreviewableFile,>({
  open,
  onClose,
  files,
  removeFile,
  handlePreview,
  fileTypeLabels,
  title = 'Archivos adjuntos',
}: FileListDrawerProps<TFile>) => {
  return (
    <Drawer
      title={title}
      placement="bottom"
      onClose={onClose}
      open={open}
      width={520}
    >
      <FileList<TFile>
        files={files}
        removeFile={removeFile}
        handlePreview={handlePreview}
        fileTypeLabels={fileTypeLabels}
      />
    </Drawer>
  );
};

export default FileListDrawer;
