import { EyeOutlined, FullscreenOutlined } from '@ant-design/icons';
import { Spin, Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

export const ImageGallery = ({ images = [], loading = false }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [imageLoading, setImageLoading] = useState({});

  const handlePreview = useCallback((image, index) => {
    setPreviewImage(image.img);
    setPreviewTitle(`Imagen ${index + 1}`);
    setPreviewVisible(true);
  }, []);

  const handleImageLoad = useCallback((index) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }));
  }, []);

  const handleImageError = useCallback((index) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }));
  }, []);

  const handleImageStart = useCallback((index) => {
    setImageLoading((prev) => ({ ...prev, [index]: true }));
  }, []);

  if (loading) {
    return (
      <LoadingContainer>
        <Spin size="large" tip="Cargando galería..." />
      </LoadingContainer>
    );
  }

  if (!images.length) {
    return (
      <EmptyContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <EmptyText>No hay imágenes disponibles</EmptyText>
      </EmptyContainer>
    );
  }

  return (
    <>
      <GalleryContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <AnimatePresence>
          {images.map((image, index) => (
            <ImageWrapper
              key={index}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -30 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: 'easeOut',
              }}
              whileHover={{
                scale: 1.03,
                y: -5,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <ImageContainer>
                {imageLoading[index] && (
                  <ImageLoadingOverlay>
                    <Spin size="small" />
                  </ImageLoadingOverlay>
                )}
                <StyledImage
                  src={image.img}
                  alt={`Imagen ${index + 1} - ${image.title || 'Sin título'}`}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  onLoadStart={() => handleImageStart(index)}
                  loading="lazy"
                />
                <ImageOverlay
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <OverlayButton
                    onClick={() => handlePreview(image, index)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <EyeOutlined />
                  </OverlayButton>
                  <OverlayButton
                    onClick={() => handlePreview(image, index)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FullscreenOutlined />
                  </OverlayButton>
                </ImageOverlay>
              </ImageContainer>
              {image.title && (
                <ImageTitle
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {image.title}
                </ImageTitle>
              )}
            </ImageWrapper>
          ))}
        </AnimatePresence>
      </GalleryContainer>

      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ top: 20 }}
        destroyOnHidden
      >
        <PreviewImage src={previewImage} alt={previewTitle} />
      </Modal>
    </>
  );
};

// Styled Components
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 2rem;
`;

const EmptyContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin: 1rem;
`;

const EmptyText = styled.p`
  color: #64748b;
  font-size: 1.1rem;
  font-weight: 500;
`;

const GalleryContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
  }
`;

const ImageWrapper = styled(motion.div)`
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: #ffffff;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.4s ease;
`;

const ImageLoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 2;
`;

const ImageOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.2) 100%
  );
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  opacity: 0;
`;

const OverlayButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1f2937;
  font-size: 18px;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
    color: var(--color, #1890ff);
  }
`;

const ImageTitle = styled(motion.p)`
  padding: 16px;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  text-align: center;
  line-height: 1.4;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
`;
