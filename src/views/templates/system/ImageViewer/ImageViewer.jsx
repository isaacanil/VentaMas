import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'; // <-- Importa aquí
import styled from 'styled-components';

import {
  selectImageViewerShow,
  selectImageViewerURL,
  toggleImageViewer,
} from '../../../../features/imageViewer/imageViewerSlice';
import { useClickOutSide } from '../../../../hooks/useClickOutSide';
import { Button } from '../Button/Button';
import { CenteredText } from '../CentredText';
import Typography from '../Typografy/Typografy';

const ImageViewer = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectImageViewerShow);
  const url = useSelector(selectImageViewerURL);
  const imgRef = useRef(null);

  const onClose = () => dispatch(toggleImageViewer({ show: false, url: '' }));

  useClickOutSide(imgRef, show, onClose);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

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
                  contentStyle={{ width: '100%', height: '100%' }}
                  wrapperStyle={{ width: '100%', height: '100%' }}
                >
                  <img
                    src={url}
                    alt="Visualización de imagen"
                    style={{ width: '100%', objectFit: 'contain' }}
                  />
                </TransformComponent>
              </TransformWrapper>
            </ImageContainer>
          )}
          {!url && (
            <CenteredText
              textVariant="h2"
              containerVariant="contained"
              text={'No se proporciono una imagen para visualizar'}
            />
          )}
        </Overlay>
      )}
    </AnimatePresence>
  );
};

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  display: grid;
  gap: 0.5em;
  align-items: start;
  width: 100vw;
  height: 100%;
  padding: 0.3em;
  background-color: rgb(0 0 0 / 80%);
`;

const ImageContainer = styled.div`
  width: calc(100%);
  height: calc(88vh);
  overflow: hidden;
  object-fit: contain;
  background-color: #000;
  border-radius: 10px;

  /* .content-style {
    width: 100%;
    height: 100%;
} */

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const Header = styled.div`
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5em 1em;
  background-color: #2e2e2e;
  border-radius: 10px;
`;
export default ImageViewer;
