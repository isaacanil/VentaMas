import {
  DeleteOutlined,
  InboxOutlined,
  PictureOutlined,
} from '@/constants/icons/antd';
import {
  Button,
  Image,
  Modal,
  Progress,
  Typography,
  Upload,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { imgFailed } from '@/domain/products/productAssets';
import { selectUser } from '@/features/auth/userSlice';
import {
  ChangeProductImage,
  selectUpdateProductData,
} from '@/features/updateProduct/updateProductSlice';
import { fbGetProductsImg } from '@/firebase/products/productsImg/fbGetProductsImg';

import { Gallery } from './components/Gallery';
import { uploadProductImage } from './utils/uploadProductImage';
import type { UploadFile, UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import type { ProductImageRecord, ProductRecord } from '@/types/products';
import type { UserIdentity } from '@/types/users';

type UploadRequestOption = Parameters<
  NonNullable<UploadProps['customRequest']>
>[0];

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
`;

const MainContent = styled.div`
  display: grid;
  flex: 1;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  min-height: 0;

  @media (width <= 1024px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const UploadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;

  .anticon {
    font-size: 16px;
    color: #6b7280;
  }
`;

const UploadContainer = styled.div`
  position: relative;
  padding: 20px;
  background: #fafafa;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8faff;
    border-color: #3b82f6;
  }

  .ant-upload-drag {
    padding: 24px 16px !important;
    background: transparent !important;
    border: none !important;
  }

  .ant-upload-drag:hover {
    background: transparent !important;
  }

  .ant-upload-drag-icon {
    margin-bottom: 8px !important;
    font-size: 36px !important;
    color: #6b7280 !important;
  }

  .ant-upload-text {
    margin-bottom: 4px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #374151 !important;
  }

  .ant-upload-hint {
    font-size: 12px !important;
    color: #6b7280 !important;
  }
`;

const ProgressContainer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 95%);
  border-radius: 6px;
  backdrop-filter: blur(2px);
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PreviewCard = styled.div`
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%);
`;

const ImagePreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 180px;
  margin-bottom: 12px;
  overflow: hidden;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .no-image {
    font-size: 36px;
    color: #9ca3af;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const GallerySection = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: 1 / -1;
  gap: 12px;
`;

const GalleryContainer = styled.div`
  padding: 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%);
`;

const HelpText = styled.p`
  padding: 8px 12px;
  margin: 0 0 16px;
  font-size: 13px;
  color: #6b7280;
  background: #f9fafb;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
`;

type ImageManagerProps = {
  open: boolean;
  onCancel: () => void;
};

// React component
const ImageManager = ({ open, onCancel }: ImageManagerProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [images, setImages] = useState<ProductImageRecord[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const { product } = useSelector(selectUpdateProductData) as {
    product: ProductRecord;
  };
  const productImg = product?.image;
  const dispatch = useDispatch();

  const updateFileListWithProgress = (file: UploadFile, progress: number) => {
    setFileList((prevFileList) =>
      prevFileList.map((f) => {
        if (f.uid === file.uid) {
          return {
            ...f,
            percent: progress,
            name: file.name,
            status: 'uploading',
          };
        }
        return f;
      }),
    );
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    showUploadList: false,
    customRequest: (options: UploadRequestOption) => {
      const { file, onProgress } = options;
      const typedFile = file as RcFile;
      const newFile: UploadFile = {
        uid: typedFile.uid,
        name: typedFile.name,
        percent: 0,
        status: 'uploading',
      };
      setFileList([newFile]);

      void uploadProductImage({
        file: typedFile,
        onProgress: (progress) => {
          updateFileListWithProgress(newFile, progress);
          if (onProgress) {
            onProgress({ percent: progress });
          }
        },
        user,
      }).then((result) => {
        if (result.status === 'success') {
          message.success('Imagen cargada correctamente');
          setFileList([result.uploadFile]);
        } else {
          message.error(result.errorMessage);
          setFileList(result.uploadFile ? [result.uploadFile] : []);
        }

        setTimeout(() => setFileList([]), 1000);
      });
    },
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Solo se permiten archivos de imagen');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('El archivo debe ser menor a 5MB');
        return false;
      }
      return true;
    },
  };

  useEffect(() => {
    return fbGetProductsImg(user, setImages);
  }, [user]);

  const uploadProgress = fileList.length > 0 ? (fileList[0].percent ?? 0) : 0;
  const isUploading = fileList.length > 0 && fileList[0].status === 'uploading';

  const handleRemoveImage = () => {
    dispatch(ChangeProductImage(null));
  };

  return (
    <Modal
      title="Biblioteca de imágenes"
      width={720}
      open={open}
      destroyOnHidden
      onCancel={onCancel}
      footer={null}
      style={{ top: 10 }}
      styles={{ body: { padding: 0 } }}
    >
      <Container>
        <MainContent>
          <UploadSection>
            <SectionTitle>
              <InboxOutlined />
              Cargar Imagen
            </SectionTitle>

            <UploadContainer>
              <Upload.Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Seleccionar imagen del producto
                </p>
                <p className="ant-upload-hint">JPG, PNG o GIF • Máximo 5MB</p>
              </Upload.Dragger>

              {isUploading && (
                <ProgressContainer>
                  <Typography.Text
                    strong
                    style={{
                      marginBottom: 16,
                      color: '#374151',
                      textAlign: 'center',
                    }}
                  >
                    Cargando imagen…
                  </Typography.Text>
                  <Progress
                    percent={Math.round(uploadProgress)}
                    status="active"
                    strokeColor={{
                      '0%': '#3b82f6',
                      '100%': '#1d4ed8',
                    }}
                    style={{ width: '80%' }}
                  />
                </ProgressContainer>
              )}
            </UploadContainer>
          </UploadSection>

          <PreviewSection>
            <SectionTitle>
              <PictureOutlined />
              Vista Previa
            </SectionTitle>

            <PreviewCard>
              <ImagePreview>
                {productImg ? (
                  <Image
                    src={productImg}
                    alt="Imagen del producto"
                    width="100%"
                    height="100%"
                    style={{ objectFit: 'cover' }}
                    fallback={imgFailed}
                  />
                ) : (
                  <PictureOutlined className="no-image" />
                )}
              </ImagePreview>

              <ButtonGroup>
                <Button
                  disabled={!productImg}
                  onClick={handleRemoveImage}
                  icon={<DeleteOutlined />}
                  danger
                  block
                  size="small"
                >
                  Remover
                </Button>
              </ButtonGroup>
            </PreviewCard>
          </PreviewSection>
        </MainContent>

        <GallerySection>
          <SectionTitle>
            <PictureOutlined />
            Imágenes Disponibles
          </SectionTitle>

          <GalleryContainer>
            <HelpText>
              💡 Selecciona una imagen de la galería para asignarla al producto
            </HelpText>
            <Gallery images={images} />
          </GalleryContainer>
        </GallerySection>
      </Container>
    </Modal>
  );
};

export default ImageManager;
