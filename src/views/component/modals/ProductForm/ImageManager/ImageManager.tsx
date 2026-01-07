// @ts-nocheck
import {
  DeleteOutlined,
  InboxOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { Button, Image, Upload, Typography, message, Progress, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  ChangeProductImage,
  selectUpdateProductData,
} from '@/features/updateProduct/updateProductSlice';
import { fbAddProductImg } from '@/firebase/products/productsImg/fbAddProductImg';
import { fbAddProductImgData } from '@/firebase/products/productsImg/fbAddProductImgData';
import { fbGetProductsImg } from '@/firebase/products/productsImg/fbGetProductsImg';

import { Gallery } from './components/Gallery';

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

// React component
const ImageManager = ({ open, onCancel }) => {
  const user = useSelector(selectUser);
  const [images, setImages] = useState([]);
  const [fileList, setFileList] = useState([]);
  const { product } = useSelector(selectUpdateProductData);
  const productImg = product?.image;
  const dispatch = useDispatch();

  const updateFileListWithProgress = (file, progress) => {
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

  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    showUploadList: false,
    customRequest: async ({ file, onProgress }) => {
      try {
        const newFile = { ...file, percent: 0, status: 'uploading' };
        setFileList([newFile]);

        const updateProgress = (progress) => {
          updateFileListWithProgress(file, progress);
          if (onProgress) {
            onProgress({ percent: progress });
          }
        };

        const url = await fbAddProductImg(user, file, updateProgress);
        await fbAddProductImgData(user, url);
        message.success('Imagen cargada correctamente');
        setFileList([{ ...newFile, status: 'done', url }]);
      } catch (error) {
        console.error('Error al cargar la imagen', error);
        message.error('Error al cargar la imagen');
        setFileList([{ ...file, status: 'error' }]);
      } finally {
        setTimeout(() => setFileList([]), 1000);
      }
    },
    beforeUpload: (file) => {
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
    fbGetProductsImg(user, setImages);
  }, [user]);

  const uploadProgress = fileList.length > 0 ? fileList[0].percent : 0;
  const isUploading = fileList.length > 0 && fileList[0].status === 'uploading';

  const handleRemoveImage = () => {
    dispatch(ChangeProductImage(null));
  };

  return (
    <Modal
      title="Biblioteca de imágenes"
      width={720}
      open={open}
      destroyOnClose
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
                <p className="ant-upload-text">Seleccionar imagen del producto</p>
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
                    Cargando imagen...
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

export const imgFailed =
  'data:image/png;base64,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';
