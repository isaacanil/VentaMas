import { Button, Modal, Typography, Empty } from 'antd';
import { useDispatch } from 'react-redux';

import FileList from './FileList';

const { Text } = Typography;

type FileRecord = {
  name: string;
  type: string;
  size?: number;
  url: string;
};

type FileListModalData = {
  fileList: FileRecord[];
  isOpen: boolean;
};

type FileListModalProps = {
  data: FileListModalData;
  onClose: () => { type: string } | void;
};

export const FileListModal = ({ data, onClose }: FileListModalProps) => {
  const { fileList, isOpen } = data;
  const dispatch = useDispatch();
  const toggleFileListModal = () => {
    const action = onClose();
    if (action) {
      dispatch(action);
    }
  };
  return (
    <Modal
      style={{ top: 10 }}
      title="Archivos"
      open={isOpen}
      onCancel={toggleFileListModal}
      footer={[
        <Button key="back" onClick={toggleFileListModal}>
          Cerrar
        </Button>,
      ]}
    >
      {fileList.length > 0 && <FileList files={fileList} />}
      {fileList.length === 0 && (
        <Empty
          description={<Text type="secondary">No hay archivos adjuntos</Text>}
        ></Empty>
      )}
    </Modal>
  );
};
