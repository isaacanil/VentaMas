import { UploadOutlined } from '@/constants/icons/antd';
import { Button, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';

import { Actions } from './LoginImageActions.styles';

type LoginImageActionsProps = {
  beforeUpload: UploadProps['beforeUpload'];
  fileList: UploadFile[];
  loadingAction: boolean;
  onUpload: () => void;
};

export const LoginImageActions = ({
  beforeUpload,
  fileList,
  loadingAction,
  onUpload,
}: LoginImageActionsProps) => (
  <Actions>
    <Upload
      beforeUpload={beforeUpload}
      fileList={fileList}
      showUploadList={false}
      maxCount={1}
      disabled={loadingAction}
    >
      <Button icon={<UploadOutlined />} size="large">
        Seleccionar Imagen
      </Button>
    </Upload>

    {fileList.length > 0 && (
      <Button
        type="primary"
        onClick={onUpload}
        disabled={loadingAction}
        size="large"
      >
        {loadingAction ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    )}
  </Actions>
);
