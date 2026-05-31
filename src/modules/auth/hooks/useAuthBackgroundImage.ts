import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchAuthBackgroundImageUrl } from '../repositories/authBackgroundImage.repository';

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

    fetchAuthBackgroundImageUrl()
      .then((imageUrl) => {
        if (cancelled) return;

        if (!imageUrl) {
          setState({
            imageUrl: null,
            imageLoadState: 'idle',
          });
          return;
        }

        setState({
          imageUrl,
          imageLoadState: 'loading',
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
