import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { storage } from '@/firebase/firebaseconfig';

const LOGIN_IMAGE_PATH = 'app-config/login-image';

type ImageLoadState = 'loading' | 'loaded' | 'idle';

type BackgroundImageState = {
  imageUrl: string | null;
  imageLoadState: ImageLoadState;
};

const INITIAL_STATE: BackgroundImageState = {
  imageUrl: null,
  imageLoadState: 'loading',
};

export const useAuthBackgroundImage = () => {
  const [state, setState] = useState<BackgroundImageState>(INITIAL_STATE);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loginImageRef = ref(storage, LOGIN_IMAGE_PATH);

    listAll(loginImageRef)
      .then((files) => {
        if (cancelled) return undefined;
        if (!files.items.length) {
          setState({
            imageUrl: null,
            imageLoadState: 'idle',
          });
          return undefined;
        }

        return getDownloadURL(files.items[0]).then((imageUrl) => {
          if (cancelled) return;
          setState({
            imageUrl,
            imageLoadState: 'loading',
          });
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Error al cargar la imagen de auth:', error);
        setState({
          imageUrl: null,
          imageLoadState: 'idle',
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const markImageAsLoaded = useCallback(() => {
    setState((currentState) =>
      currentState.imageLoadState === 'loaded'
        ? currentState
        : {
            ...currentState,
            imageLoadState: 'loaded',
          },
    );
  }, []);

  const markImageAsUnavailable = useCallback((error?: unknown) => {
    if (error) {
      console.error('No se pudo cargar la imagen:', error);
    }

    setState({
      imageUrl: null,
      imageLoadState: 'idle',
    });
  }, []);

  return {
    imageLoadState: state.imageLoadState,
    imageUrl: state.imageUrl,
    imgRef,
    markImageAsLoaded,
    markImageAsUnavailable,
  };
};
