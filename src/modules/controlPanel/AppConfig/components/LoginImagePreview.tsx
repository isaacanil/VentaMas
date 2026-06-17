import { DeleteOutlined } from '@/constants/icons/antd';
import { Empty, Image, Spin } from 'antd';

import { DeleteBtn, ImageContainer, Section } from './LoginImagePreview.styles';

type LoginImagePreviewProps = {
  currentImage: string | null;
  loadingAction: boolean;
  loadingFetch: boolean;
  onDelete: () => void;
};

export const LoginImagePreview = ({
  currentImage,
  loadingAction,
  loadingFetch,
  onDelete,
}: LoginImagePreviewProps) => (
  <Section>
    {loadingFetch ? (
      <Spin size="large" />
    ) : !currentImage ? (
      <Empty description="No hay imagen configurada" />
    ) : (
      <ImageContainer>
        <Image src={currentImage} alt="Login" preview={false} />
        <DeleteBtn
          icon={<DeleteOutlined />}
          onClick={onDelete}
          disabled={loadingAction}
        >
          {loadingAction ? <Spin size="small" /> : 'Eliminar'}
        </DeleteBtn>
      </ImageContainer>
    )}
  </Section>
);
