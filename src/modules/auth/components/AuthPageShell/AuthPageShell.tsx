import { Spin } from 'antd';
import type { Variants } from 'framer-motion';
import { useCallback, type JSX, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { icons } from '@/constants/icons/icons';
import { useAuthBackgroundImage } from '@/modules/auth/hooks/useAuthBackgroundImage';

import {
  BackButton,
  Background,
  Container,
  ImageFrame,
  ImageSide,
  MotionImageWrapper,
  PageRoot,
  VisualImage,
} from './AuthPageShell.styles';

type AuthPageShellProps = {
  children: ReactNode;
  imageAlt: string;
  loading: boolean;
  loadingTip: string;
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export const AuthPageShell = ({
  children,
  imageAlt,
  loading,
  loadingTip,
}: AuthPageShellProps): JSX.Element => {
  const navigate = useNavigate();
  const {
    imageLoadState,
    imageUrl,
    imgRef,
    markImageAsLoaded,
    markImageAsUnavailable,
  } = useAuthBackgroundImage();

  const goToWelcome = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  const isImageLoaded = imageLoadState === 'loaded';
  const isImageVisible = !!imageUrl && isImageLoaded;

  return (
    <PageRoot>
      <Spin spinning={loading} fullscreen tip={loadingTip} />

      <Background>
        <Container $isImageLoaded={isImageVisible}>
          <ImageSide $isVisible={isImageVisible}>
            <BackButton type="button" onClick={goToWelcome}>
              {icons.arrows.arrowLeft}
              <span>Volver</span>
            </BackButton>

            {imageUrl ? (
              <MotionImageWrapper
                key={imageUrl}
                initial="hidden"
                animate={isImageLoaded ? 'visible' : 'hidden'}
                variants={imageVariants}
              >
                <ImageFrame>
                  <VisualImage
                    ref={imgRef}
                    src={imageUrl}
                    alt={imageAlt}
                    $isLoaded={isImageLoaded}
                    onLoad={markImageAsLoaded}
                    onError={() => {
                      markImageAsUnavailable(imageUrl);
                    }}
                  />
                </ImageFrame>
              </MotionImageWrapper>
            ) : null}
          </ImageSide>

          {children}
        </Container>
      </Background>
    </PageRoot>
  );
};
