import { Upload, message } from 'antd';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';

import { storage } from '@/firebase/firebaseconfig';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { LoginImageActions } from './components/LoginImageActions';
import { LoginImagePreview } from './components/LoginImagePreview';
import { LoginImageProgress } from './components/LoginImageProgress';
import { Content, Page } from './LoginImageConfig.styles';
import {
  compressLoginImageIterative,
  LOGIN_IMAGE_STORAGE_PATH,
  resolveUploadFile,
} from './utils/loginImageCompression';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

interface LoginImageConfigState {
  compressedSize: number | null;
  currentImage: string | null;
  fileList: UploadFile[];
  loadingAction: boolean;
  loadingFetch: boolean;
  originalSize: number | null;
  progress: number;
}

type LoginImageConfigAction = {
  type: 'patch';
  patch: Partial<LoginImageConfigState>;
};

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
): LoginImageConfigState => ({
  ...state,
  ...action.patch,
});

const LoginImageConfig = () => {
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

  const loginImageRef = useMemo(
    () => ref(storage, LOGIN_IMAGE_STORAGE_PATH),
    [],
  );

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
      await Promise.all(files.items.map((file) => deleteObject(file)));
      dispatchState({ type: 'patch', patch: { currentImage: null } });
      message.success('Imagen eliminada correctamente');
    } catch (error) {
      console.error('Error deleting image:', error);
      message.error('Error al eliminar la imagen');
    } finally {
      dispatchState({ type: 'patch', patch: { loadingAction: false } });
    }
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
      const selectedFile = fileList[0];
      const file = selectedFile?.originFileObj;
      if (!file) {
        message.error('No se pudo leer el archivo seleccionado');
        return;
      }

      const originalSizeKb = Number((file.size / 1024).toFixed(1));
      dispatchState({
        type: 'patch',
        patch: { originalSize: originalSizeKb },
      });

      const compressedFile = await compressLoginImageIterative(file, (value) =>
        dispatchState({ type: 'patch', patch: { progress: value } }),
      );
      const compressedSizeKb = Number((compressedFile.size / 1024).toFixed(1));
      dispatchState({
        type: 'patch',
        patch: { compressedSize: compressedSizeKb },
      });

      const files = await listAll(loginImageRef);
      await Promise.all(files.items.map((file) => deleteObject(file)));

      const imageRef = ref(loginImageRef, selectedFile.name);
      const fileToUpload = resolveUploadFile(compressedFile, file);
      await uploadBytes(imageRef, fileToUpload);

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
    } finally {
      dispatchState({
        type: 'patch',
        patch: {
          loadingAction: false,
          progress: 0,
        },
      });
    }
  };

  return (
    <Page>
      <MenuApp
        sectionName="Imagen de Login"
        showBackButton
        onBackClick={() => navigate(-1)}
      />
      <Content>
        <LoginImagePreview
          currentImage={currentImage}
          loadingAction={loadingAction}
          loadingFetch={loadingFetch}
          onDelete={clearCurrentImage}
        />
        <LoginImageActions
          beforeUpload={beforeUpload}
          fileList={fileList}
          loadingAction={loadingAction}
          onUpload={handleUpload}
        />
        <LoginImageProgress
          compressedSize={compressedSize}
          loadingAction={loadingAction}
          originalSize={originalSize}
          progress={progress}
        />
      </Content>
    </Page>
  );
};

export default LoginImageConfig;
