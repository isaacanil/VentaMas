import { Spin } from 'antd';
import { m, type Variants } from 'framer-motion';
import { useCallback, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { useAuthBackgroundImage } from '@/modules/auth/hooks/useAuthBackgroundImage';

import { SignUpAccountForm } from './components/SignUpAccountForm';

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export const SignUp = (): JSX.Element => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    imageLoadState,
    imageUrl: authImage,
    imgRef,
    markImageAsLoaded,
    markImageAsUnavailable,
  } = useAuthBackgroundImage();

  const goToWelcome = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  const isImageVisible = !!authImage && imageLoadState === 'loaded';

  return (
    <div style={{ position: 'relative', height: '100%', width: '100vw' }}>
      <Spin spinning={loading} fullscreen tip="Creando cuenta..." />

      <Background>
        <Container $isImageLoaded={isImageVisible}>
          <ImageSide $isVisible={isImageVisible}>
            <ButtonBack onClick={goToWelcome}>
              {icons.arrows.arrowLeft}
              <span>Volver</span>
            </ButtonBack>

            {authImage ? (
              <m.div
                key={authImage}
                initial="hidden"
                animate={imageLoadState === 'loaded' ? 'visible' : 'hidden'}
                variants={imageVariants}
                style={{ height: '100%', position: 'relative' }}
              >
                <ImageFrame>
                  <img
                    ref={imgRef}
                    src={authImage}
                    alt="Registro visual"
                    onLoad={markImageAsLoaded}
                    onError={() => {
                      markImageAsUnavailable(authImage);
                    }}
                    style={{
                      visibility:
                        imageLoadState === 'loaded' ? 'visible' : 'hidden',
                    }}
                  />
                </ImageFrame>
              </m.div>
            ) : null}
          </ImageSide>

          <SignUpAccountForm setLoading={setLoading} />
        </Container>
      </Background>
    </div>
  );
};

export default SignUp;

const Background = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.05;
    z-index: 1;
    mix-blend-mode: soft-light;
  }
`;

const ButtonBack = styled.button`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 10;
  display: flex;
  gap: 0.6rem;
  align-items: center;
  padding: 0.6rem 1.25rem;
  color: rgb(255 255 255 / 90%);
  cursor: pointer;
  background: rgb(44 44 44 / 33%);
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 999px;
  backdrop-filter: blur(8px);
`;

const ImageFrame = styled.div`
  height: 100%;
  max-height: 100vh;
  overflow: hidden;
  border-radius: 1em;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ImageSide = styled.div<{ $isVisible: boolean }>`
  position: relative;
  display: ${({ $isVisible }) => ($isVisible ? 'block' : 'none')};
  height: 100%;

  @media (width <= 800px) {
    display: none;
  }
`;

const Container = styled.div<{ $isImageLoaded: boolean }>`
  display: grid;
  grid-template-columns: ${({ $isImageLoaded }) =>
    $isImageLoaded ? '1.1fr 1fr' : '1fr'};
  gap: 1.5rem;
  width: 100%;
  max-width: ${({ $isImageLoaded }) => ($isImageLoaded ? '1100px' : '650px')};
  max-height: min(900px, 95vh);
  padding: 0.8rem;
  margin: auto;
  background-color: #1f1f1f;
  border-radius: 1.25em;
  border: 1px solid #474747ff;
  box-shadow: 0 24px 48px rgb(0 0 0 / 40%);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / 20%) transparent;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(255 255 255 / 20%);
    border-radius: 20px;
    border: transparent;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgb(255 255 255 / 30%);
  }

  @media (width <= 1000px) {
    grid-template-columns: ${({ $isImageLoaded }) =>
      $isImageLoaded ? '1fr 1fr' : '1fr'};
  }

  @media (width <= 800px) {
    grid-template-columns: 1fr;
    justify-items: center;
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    padding: 0.5rem 0;
    box-sizing: border-box;
    border-radius: 0;
    overflow: hidden;
  }
`;
