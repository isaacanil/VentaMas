// Instala las dependencias:
// npm i browser-image-compression
// npm i firebase antd styled-components

import { UploadOutlined, DeleteOutlined } from '@/constants/icons/antd';
import { Upload, Button, message, Image, Spin, Progress, Empty } from 'antd';
import imageCompression from 'browser-image-compression';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { storage } from '@/firebase/firebaseconfig';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

// Parámetros de compresión
const TARGET_SIZE_MB = 0.4; // Tamaño máximo deseado en MB (ajustado para mejor calidad)
const MAX_DIMENSION = 1024; // Máx. ancho/alto en px
const QUALITY_STEP = 0.1;
const MIN_QUALITY = 0.1;

const LoginImageConfig: React.FC = () => {
  const navigate = useNavigate();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [progress, setProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const loginImageRef = ref(storage, 'app-config/login-image');

  const fetchCurrentImage = useCallback(async () => {
    try {
      const files = await listAll(loginImageRef);
      if (files.items.length > 0) {
        const url = await getDownloadURL(files.items[0]);
        setCurrentImage(url);
      }
    } catch (error) {
      console.error('Error fetching current image:', error);
      message.error('Error al cargar la imagen actual');
    } finally {
      setLoadingFetch(false);
    }
  }, [loginImageRef]);

  useEffect(() => {
    fetchCurrentImage();
  }, [fetchCurrentImage]);

  const compressImageIterative = async (file: File): Promise<File> => {
    const baseOptions = {
      maxWidthOrHeight: MAX_DIMENSION,
      useWebWorker: true,
      onProgress: (p) => setProgress(p),
    };
    let quality = 0.8;
    let compFile = file;

    while (
      compFile.size / 1024 / 1024 > TARGET_SIZE_MB &&
      quality >= MIN_QUALITY
    ) {
      const options = {
        ...baseOptions,
        maxSizeMB: TARGET_SIZE_MB,
        initialQuality: quality,
      };
      compFile = await imageCompression(file, options);
      quality -= QUALITY_STEP;
    }

    return compFile;
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Solo puedes subir imágenes');
      return Upload.LIST_IGNORE;
    }
    setFileList([
      {
        uid: file.uid,
        name: file.name,
        size: file.size,
        type: file.type,
        originFileObj: file,
        status: 'done',
      },
    ]);
    return false;
  };

  const clearCurrentImage = async () => {
    setLoadingAction(true);
    try {
      const files = await listAll(loginImageRef);
      await Promise.all(files.items.map((f) => deleteObject(f)));
      setCurrentImage(null);
      message.success('Imagen eliminada correctamente');
    } catch (error) {
      console.error('Error deleting image:', error);
      message.error('Error al eliminar la imagen');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) return;
    setLoadingAction(true);
    setProgress(0);
    try {
      // Registrar tamaño original
      const selectedFile = fileList[0];
      const file = selectedFile.originFileObj;
      if (!file) {
        message.error('No se pudo leer el archivo seleccionado');
        return;
      }
      const origKB = Number((file.size / 1024).toFixed(1));
      setOriginalSize(origKB);

      // Comprimir
      const compressedFile = await compressImageIterative(file);
      const compKB = Number((compressedFile.size / 1024).toFixed(1));
      setCompressedSize(compKB);

      // Eliminar previa en Firebase
      const files = await listAll(loginImageRef);
      await Promise.all(files.items.map((f) => deleteObject(f)));

      // Subir nueva imagen
      const imageRef = ref(loginImageRef, selectedFile.name);
      await uploadBytes(
        imageRef,
        compressedFile.size < file.size ? compressedFile : file,
      );

      // Obtener URL
      const url = await getDownloadURL(imageRef);
      setCurrentImage(url);
      setFileList([]);

      message.success('Imagen actualizada correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Error al subir la imagen');
    } finally {
      setLoadingAction(false);
      setProgress(0);
    }
  };

  const renderCurrentImage = () => {
    if (loadingFetch) return <Spin size="large" />;
    if (!currentImage) return <Empty description="No hay imagen configurada" />;

    return (
      <ImageContainer>
        <Image src={currentImage} alt="Login" preview={false} />
        <DeleteBtn
          icon={<DeleteOutlined />}
          onClick={clearCurrentImage}
          disabled={loadingAction}
        >
          {loadingAction ? <Spin size="small" /> : 'Eliminar'}
        </DeleteBtn>
      </ImageContainer>
    );
  };

  return (
    <Page>
      <MenuApp
        sectionName="Imagen de Login"
        showBackButton
        onBackClick={() => navigate(-1)}
      />
      <Content>
        <Section>{renderCurrentImage()}</Section>

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
              onClick={handleUpload}
              disabled={loadingAction}
              size="large"
            >
              {loadingAction ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          )}
        </Actions>

        {loadingAction && progress > 0 && (
          <ProgressBar>
            <Progress percent={Math.round(progress)} />
            {originalSize !== null && compressedSize !== null && (
              <Stats>
                <p>Original: {originalSize.toFixed(1)} KB</p>
                <p>Optimizado: {compressedSize.toFixed(1)} KB</p>
                <p>
                  Reducción:{' '}
                  {(
                    ((originalSize - compressedSize) / originalSize) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </Stats>
            )}
          </ProgressBar>
        )}
      </Content>
    </Page>
  );
};

// Styled Components
const Page = styled.div`
  min-height: 100vh;
  background: #f0f2f5;
`;
const Content = styled.div`
  max-width: 900px;
  padding: 0 1rem;
  margin: 2rem auto;
`;
const Section = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 1rem;
  margin-bottom: 2rem;
  background: #fff;
  border-radius: 8px;
`;
const Actions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
`;
const ImageContainer = styled.div`
  position: relative;

  .ant-image img {
    max-height: 300px;
    object-fit: contain;
  }
`;
const DeleteBtn = styled(Button)`
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  color: #fff;
  background: rgb(0 0 0 / 60%);
  border: none;

  &:hover {
    background: rgb(0 0 0 / 80%);
  }
`;
const ProgressBar = styled.div`
  max-width: 600px;
  margin: 0 auto 1rem;
`;
const Stats = styled.div`
  text-align: center;

  p {
    margin: 4px 0;
  }
`;

export default LoginImageConfig;

