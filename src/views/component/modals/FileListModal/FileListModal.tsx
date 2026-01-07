// @ts-nocheck
import { Button, Modal, Typography, Empty } from 'antd';
import { useDispatch } from 'react-redux';

import FileList from './FileList';

const { Text } = Typography;

export const FileListModal = ({ data, onClose }) => {
  const { fileList, isOpen } = data;
  const dispatch = useDispatch();
  const toggleFileListModal = () => {
    dispatch(onClose());
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
