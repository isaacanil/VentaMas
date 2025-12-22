import { Button, Skeleton, Spin } from 'antd';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '../../../constants/icons/icons';
import { selectUser } from '../../../features/auth/userSlice';
import { getStoredSession } from '../../../firebase/Auth/fbAuthV2/sessionClient';
import { storage } from '../../../firebase/firebaseconfig';

import { LoginForm } from './components/LoginForm';

const HOME_PATH = '/home';
const LOGIN_IMAGE_PATH = 'app-config/login-image';

interface StoredSession {
  sessionToken: string;
  sessionExpiresAt: number;
}

type MaybeUser = Record<string, unknown> | null;

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const parseStoredSession = (session: unknown): StoredSession | null => {
  if (!session || typeof session !== 'object') {
    return null;
  }

  const record = session as Record<string, unknown>;
  const rawToken = record.sessionToken;
  const rawExpiresAt = record.sessionExpiresAt;

  if (typeof rawToken !== 'string' || !rawToken) {
    return null;
  }

  const expiresAt =
    typeof rawExpiresAt === 'number'
      ? rawExpiresAt
      : typeof rawExpiresAt === 'string'
        ? Number(rawExpiresAt)
        : NaN;

  if (!Number.isFinite(expiresAt)) {
    return null;
  }

  return {
    sessionToken: rawToken,
    sessionExpiresAt: expiresAt,
  };
};

export const Login = (): JSX.Element => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /* ---------- imagen de fondo ---------- */
  const [loginImage, setLoginImage] = useState<string | null>(null);
  const [imageLoadState, setImageLoadState] = useState<'loading' | 'loaded' | 'idle'>('loading');
  const imgRef = useRef<HTMLImageElement | null>(null);

  /* ---------- usuario ---------- */
  const user = useSelector(selectUser) as MaybeUser;

  /* ---------- descarga de la imagen ---------- */
  useEffect(() => {
    let cancelled = false;
    const loginImageRef = ref(storage, LOGIN_IMAGE_PATH);

    listAll(loginImageRef)
      .then((files) => {
        if (cancelled) return undefined;
        if (!files.items.length) {
          setImageLoadState('idle');
          return undefined;
        }
        return getDownloadURL(files.items[0]).then((url) => {
          if (cancelled) return;
          setLoginImage(url);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error al cargar la imagen de login:', err);
        setLoginImage(null);
        setImageLoadState('idle');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* redirección si hay sesión */
  useEffect(() => {
    if (user) {
      void navigate(HOME_PATH, { replace: true });
      return;
    }

    const storedSession = parseStoredSession(getStoredSession() as unknown);
    if (storedSession && Date.now() < storedSession.sessionExpiresAt) {
      void navigate(HOME_PATH, { replace: true });
    }
  }, [user, navigate]);

  const goToHome = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100vw' }}>
      <Spin spinning={loading} fullscreen tip="Iniciando sesión..." />

      <Background>
        <Container>
          <ImagenContainer>
            <ButtonBack icon={icons.arrows.arrowLeft} onClick={goToHome}>
              Volver
            </ButtonBack>

            {loginImage && (
              <motion.div
                key={loginImage}
                initial="hidden"
                animate={imageLoadState === 'loaded' ? 'visible' : 'hidden'}
                variants={imageVariants}
                style={{ height: '100%', position: 'relative' }}
              >
                {imageLoadState === 'loading' && (
                  <Skeleton.Image
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '1em',
                      objectFit: 'cover',
                      zIndex: 1,
                    }}
                    active
                  />
                )}

                <Imagen>
                  <img
                    ref={imgRef}
                    src={loginImage}
                    alt="Login visual"
                    onLoad={() => {
                      setImageLoadState('loaded');
                    }}
                    onError={() => {
                      console.error('No se pudo cargar la imagen:', loginImage);
                      setLoginImage(null);
                      setImageLoadState('idle');
                    }}
                    style={{ visibility: imageLoadState === 'loaded' ? 'visible' : 'hidden' }}
                  />
                </Imagen>
              </motion.div>
            )}

            {!loginImage && imageLoadState === 'loading' && (
              <Skeleton.Image
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '1em',
                  objectFit: 'cover',
                }}
                active
              />
            )}

            {!loginImage && imageLoadState !== 'loading' && (
              <NoImageMsg>No hay imagen de fondo disponible.</NoImageMsg>
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
  background-color: #4d4d4d;
`;

const ButtonBack = styled(Button)`
  position: absolute;
  top: 2em;
  left: 2em;
  z-index: 10;
  display: flex;
  gap: 0.5em;
  align-items: center;
  cursor: pointer;
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

const ImagenContainer = styled.div`
  position: relative;
  height: 100%;
  max-height: min(800px, 100vh);
  padding: 1em;
  padding-right: 0;

  @media (width <= 800px) {
    display: none;
  }
`;

const NoImageMsg = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #ccc;
  background: rgb(0 0 0 / 20%);
  border: 1px dashed #777;
  border-radius: 1em;
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1366px;
  height: 100%;
  max-height: min(800px, 100vh);
  margin: 0 auto;

  @media (width <= 1000px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (width <= 800px) {
    grid-template-columns: 1fr;
    justify-content: center;
    justify-items: center;
  }
`;
