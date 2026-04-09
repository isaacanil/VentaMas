import { Spin } from 'antd';
import { m, type Variants } from 'framer-motion';
import { useCallback, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { useAuthBackgroundImage } from '@/modules/auth/hooks/useAuthBackgroundImage';

import { LoginForm } from './components/LoginForm';

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export const Login = (): JSX.Element => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    imageLoadState,
    imageUrl: loginImage,
    imgRef,
    markImageAsLoaded,
    markImageAsUnavailable,
  } = useAuthBackgroundImage();

  const goToHome = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  const isImageVisible = !!loginImage && imageLoadState === 'loaded';

  return (
    <div style={{ position: 'relative', height: '100%', width: '100vw' }}>
      <Spin spinning={loading} fullscreen tip="Iniciando sesión..." />

      <Background>
        <Container $isImageLoaded={isImageVisible}>
          <ImagenContainer $isVisible={isImageVisible}>
            <ButtonBack onClick={goToHome}>
              {icons.arrows.arrowLeft}
              <span>Volver</span>
            </ButtonBack>

            {loginImage && (
              <m.div
                key={loginImage}
                initial="hidden"
                animate={imageLoadState === 'loaded' ? 'visible' : 'hidden'}
                variants={imageVariants}
                style={{ height: '100%', position: 'relative' }}
              >
                <Imagen>
                  <img
                    ref={imgRef}
                    src={loginImage}
                    alt="Login visual"
                    onLoad={markImageAsLoaded}
                    onError={() => {
                      markImageAsUnavailable(loginImage);
                    }}
                    style={{
                      visibility:
                        imageLoadState === 'loaded' ? 'visible' : 'hidden',
                    }}
                  />
                </Imagen>
              </m.div>
            )}
          </ImagenContainer>

          <LoginForm setLoading={setLoading} />
        </Container>
      </Background>
    </div>
  );
};

/* ---------- estilos ---------- */

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
    width: 100%;
    height: 100%;
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
  font-size: 0.95rem;
  font-weight: 500;
  color: rgb(255 255 255 / 90%);
  cursor: pointer;
  background: rgb(44 44 44 / 33%);
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 999px;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;

  &:hover {
    background: rgb(255 255 255 / 10%);
    border-color: rgb(255 255 255 / 40%);
    color: #fff;
    transform: translateX(-2px);
  }

  &:active {
    transform: translateX(0);
    background: rgb(255 255 255 / 15%);
  }

  svg {
    font-size: 1.1rem;
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateX(-2px);
  }
`;

const Imagen = styled.div`
  height: 100%;
  max-height: 100vh;
  overflow: hidden;
  border-radius: 1em;

  img {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    object-fit: cover;
  }
`;

const ImagenContainer = styled.div<{ $isVisible: boolean }>`
  position: relative;
  display: ${({ $isVisible }) => ($isVisible ? 'block' : 'none')};
  height: 100%;
  padding: 0;

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
  height: auto;
  max-height: min(850px, 95vh);
  padding: 0.8rem;
  align-items: stretch;
  align-content: center;
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
  transition:
    max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1);

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
    justify-content: center;
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
