import { EyeOutlined, FullscreenOutlined } from '@/constants/icons/antd';
import { Spin, Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

interface ImageGalleryImage {
  img: string;
  title?: string;
}

interface ImageGalleryProps {
  images?: ImageGalleryImage[];
  loading?: boolean;
}

export const ImageGallery = ({ images = [], loading = false }: ImageGalleryProps) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});

  const handlePreview = useCallback((image: ImageGalleryImage, index: number) => {
    setPreviewImage(image.img);
    setPreviewTitle(`Imagen ${index + 1}`);
    setPreviewVisible(true);
  }, []);

  const handleImageLoad = useCallback((index: number) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }));
  }, []);

  const handleImageError = useCallback((index: number) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }));
  }, []);

  const handleImageStart = useCallback((index: number) => {
    setImageLoading((prev) => ({ ...prev, [index]: true }));
  }, []);

  if (loading) {
    return (
      <LoadingContainer>
        <Spin size="large" tip="Cargando galería...">
          <div style={{ width: '100%', minHeight: 200 }} />
        </Spin>
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
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
`;

const EmptyContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  margin: 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
`;

const EmptyText = styled.p`
  font-size: 1.1rem;
  font-weight: 500;
  color: #64748b;
`;

const GalleryContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1400px;
  padding: 24px;
  margin: 0 auto;

  @media (width <= 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  @media (width <= 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
  }
`;

const ImageWrapper = styled(motion.div)`
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 10%),
    0 2px 4px -1px rgb(0 0 0 / 6%);
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 20px 25px -5px rgb(0 0 0 / 10%),
      0 10px 10px -5px rgb(0 0 0 / 4%);
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
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 90%);
`;

const ImageOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    rgb(0 0 0 / 40%) 0%,
    rgb(0 0 0 / 20%) 100%
  );
  opacity: 0;
`;

const OverlayButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 18px;
  color: #1f2937;
  cursor: pointer;
  background: rgb(255 255 255 / 90%);
  border: none;
  border-radius: 50%;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;

  &:hover {
    color: var(--color, #1890ff);
    background: rgb(255 255 255 / 100%);
  }
`;

const ImageTitle = styled(motion.p)`
  padding: 16px;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: #374151;
  text-align: center;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
`;
