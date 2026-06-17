import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import {
  selectImageViewerShow,
  selectImageViewerURL,
  toggleImageViewer,
} from '@/features/imageViewer/imageViewerSlice';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { Button } from '@/components/ui/Button';
import { CenteredText } from '@/components/ui/CenteredText';
import Typography from '@/components/ui/Typography';

import {
  FULL_SIZE_TRANSFORM_STYLE,
  Header,
  ImageContainer,
  Overlay,
  ViewerImage,
} from './ImageViewer.styles';

const ImageViewer = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectImageViewerShow);
  const url = useSelector(selectImageViewerURL);
  const imgRef = useRef<HTMLDivElement>(null);

  const onClose = useCallback(() => {
    dispatch(toggleImageViewer({ show: false, url: '' }));
  }, [dispatch]);

  useClickOutSide(imgRef, show, onClose);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Header>
            <Typography disableMargins variant="h2" color="light">
              Visualizador de imagen
            </Typography>{' '}
            <Button
              title={<FontAwesomeIcon icon={faXmark} />}
              onClick={onClose}
            />
          </Header>
          {url && (
            <ImageContainer ref={imgRef}>
              <TransformWrapper minScale={1} maxScale={2} wheel={{ step: 50 }}>
                <TransformComponent
                  contentStyle={FULL_SIZE_TRANSFORM_STYLE}
                  wrapperStyle={FULL_SIZE_TRANSFORM_STYLE}
                >
                  <ViewerImage src={url} alt="Visualizacion de imagen" />
                </TransformComponent>
              </TransformWrapper>
            </ImageContainer>
          )}
          {!url && (
            <CenteredText
              textVariant="h2"
              containerVariant="contained"
              text="No se proporciono una imagen para visualizar"
            />
          )}
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default ImageViewer;
