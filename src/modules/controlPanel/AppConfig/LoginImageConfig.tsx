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
import React, { useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { storage } from '@/firebase/firebaseconfig';
import { PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

// Parámetros de compresión
const TARGET_SIZE_MB = 0.4; // Tamaño máximo deseado en MB (ajustado para mejor calidad)
const MAX_DIMENSION = 1024; // Máx. ancho/alto en px
const QUALITY_STEP = 0.1;
const MIN_QUALITY = 0.1;

const resolveUploadFile = (compressedFile: File, originalFile: File) =>
  compressedFile.size < originalFile.size ? compressedFile : originalFile;

interface LoginImageConfigState {
  compressedSize: number | null;
  currentImage: string | null;
  fileList: UploadFile[];
  loadingAction: boolean;
  loadingFetch: boolean;
  originalSize: number | null;
  progress: number;
}

type LoginImageConfigAction =
  | { type: 'patch'; patch: Partial<LoginImageConfigState> }
  | { type: 'resetProgress' };

const initialLoginImageConfigState: LoginImageConfigState = {
  compressedSize: null,
  currentImage: null,
  fileList: [],
  loadingAction: false,
  loadingFetch: true,
  originalSize: null,
  progress: 0,
};

const loginImageConfigReducer = (
  state: LoginImageConfigState,
  action: LoginImageConfigAction,
): LoginImageConfigState => {
  switch (action.type) {
    case 'patch':
      return {
        ...state,
        ...action.patch,
      };
    case 'resetProgress':
      return {
        ...state,
        progress: 0,
      };
    default:
      return state;
  }
};

const LoginImageConfig: React.FC = () => {
  const navigate = useNavigate();
  const [state, dispatchState] = useReducer(
    loginImageConfigReducer,
    initialLoginImageConfigState,
  );
  const {
    compressedSize,
    currentImage,
    fileList,
    loadingAction,
    loadingFetch,
    originalSize,
    progress,
  } = state;

  const loginImageRef = ref(storage, 'app-config/login-image');

  useEffect(() => {
    let isSubscribed = true;

    void listAll(loginImageRef)
      .then((files) => {
        if (!files.items.length) return null;
        return getDownloadURL(files.items[0]);
      })
      .then((url) => {
        if (!isSubscribed) return;
        dispatchState({ type: 'patch', patch: { currentImage: url } });
      })
      .catch((error) => {
        if (!isSubscribed) return;
        console.error('Error fetching current image:', error);
        message.error('Error al cargar la imagen actual');
      })
      .finally(() => {
        if (!isSubscribed) return;
        dispatchState({ type: 'patch', patch: { loadingFetch: false } });
      });

    return () => {
      isSubscribed = false;
    };
  }, [loginImageRef]);

  const compressImageIterative = async (file: File): Promise<File> => {
    const baseOptions = {
      maxWidthOrHeight: MAX_DIMENSION,
      useWebWorker: true,
      onProgress: (p: number) =>
        dispatchState({ type: 'patch', patch: { progress: p } }),
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
    dispatchState({
      type: 'patch',
      patch: {
        fileList: [
          {
            uid: file.uid,
            name: file.name,
            size: file.size,
            type: file.type,
            originFileObj: file,
            status: 'done',
          },
        ],
      },
    });
    return false;
  };

  const clearCurrentImage = async () => {
    dispatchState({ type: 'patch', patch: { loadingAction: true } });
    try {
      const files = await listAll(loginImageRef);
      await Promise.all(files.items.map((f) => deleteObject(f)));
      dispatchState({ type: 'patch', patch: { currentImage: null } });
      message.success('Imagen eliminada correctamente');
    } catch (error) {
      console.error('Error deleting image:', error);
      message.error('Error al eliminar la imagen');
    }
    dispatchState({ type: 'patch', patch: { loadingAction: false } });
  };

  const handleUpload = async () => {
    if (fileList.length === 0) return;
    dispatchState({
      type: 'patch',
      patch: {
        loadingAction: true,
        progress: 0,
      },
    });
    try {
      // Registrar tamaño original
      const selectedFile = fileList[0];
      const file = selectedFile.originFileObj;
      if (!file) {
        message.error('No se pudo leer el archivo seleccionado');
        return;
      }
      const origKB = Number((file.size / 1024).toFixed(1));
      dispatchState({ type: 'patch', patch: { originalSize: origKB } });

      // Comprimir
      const compressedFile = await compressImageIterative(file);
      const compKB = Number((compressedFile.size / 1024).toFixed(1));
      dispatchState({ type: 'patch', patch: { compressedSize: compKB } });

      // Eliminar previa en Firebase
      const files = await listAll(loginImageRef);
      await Promise.all(files.items.map((f) => deleteObject(f)));

      // Subir nueva imagen
      const imageRef = ref(loginImageRef, selectedFile.name);
      const fileToUpload = resolveUploadFile(compressedFile, file);
      await uploadBytes(imageRef, fileToUpload);

      // Obtener URL
      const url = await getDownloadURL(imageRef);
      dispatchState({
        type: 'patch',
        patch: {
          currentImage: url,
          fileList: [],
        },
      });

      message.success('Imagen actualizada correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Error al subir la imagen');
    }
    dispatchState({
      type: 'patch',
      patch: {
        loadingAction: false,
        progress: 0,
      },
    });
  };

  return (
    <Page>
      <MenuApp
        sectionName="Imagen de Login"
        showBackButton
        onBackClick={() => navigate(-1)}
      />
      <Content>
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
                onClick={clearCurrentImage}
                disabled={loadingAction}
              >
                {loadingAction ? <Spin size="small" /> : 'Eliminar'}
              </DeleteBtn>
            </ImageContainer>
          )}
        </Section>

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
const Page = styled(PageShell)`
  background: #f0f2f5;
`;
const Content = styled.div`
  flex: 1 1 auto;
  min-height: 0;
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
