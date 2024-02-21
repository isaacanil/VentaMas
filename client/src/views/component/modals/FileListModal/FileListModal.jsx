import * as antd from 'antd';
import FileList from '../../../pages/OrderAndPurchase/CreatePurchase/components/FileList';
import { useDispatch } from 'react-redux';

const { Button, Tag, Modal, Typography, Empty } = antd;
const { Text, Title, Paragraph } = Typography;

export const FileListModal = ({ data, onClose }) => {
    const { fileList, isOpen } = data;
    const dispatch = useDispatch();
    const toggleFileListModal = () => {
        dispatch(onClose());
    }
    return (
        <Modal
        style={{ top: 10 }}
            title="Archivos"
            open={isOpen}
            onCancel={toggleFileListModal}
            footer={[
                <Button key="back" onClick={toggleFileListModal}>
                    Cerrar
                </Button>
            ]}
        >
        
            {fileList.length > 0 &&
                <FileList

                    files={fileList}
                />}
            {fileList.length === 0 &&
                <Empty
                    description={
                        <Text type="secondary">
                            No hay archivos adjuntos
                        </Text>
                    }
                ></Empty>}
        </Modal>
    )
}