import { Button, Skeleton, Spin } from "antd";
import { ref, getDownloadURL, listAll } from "firebase/storage";
import { motion, type Variants } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
} from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { icons } from "../../../constants/icons/icons";
import { selectUser } from "../../../features/auth/userSlice";
import { getStoredSession } from "../../../firebase/Auth/fbAuthV2/sessionClient";
import { storage } from "../../../firebase/firebaseconfig";
import { LoginForm } from "./components/LoginForm";

const HOME_PATH = "/home";
const LOGIN_IMAGE_PATH = "app-config/login-image";

type StoredSession = {
  sessionToken: string;
  sessionExpiresAt: number;
};

type MaybeUser = Record<string, unknown> | null;

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const parseStoredSession = (session: unknown): StoredSession | null => {
  if (!session || typeof session !== "object") {
    return null;
  }

  const record = session as Record<string, unknown>;
  const rawToken = record.sessionToken;
  const rawExpiresAt = record.sessionExpiresAt;

  if (typeof rawToken !== "string" || !rawToken) {
    return null;
  }

  const expiresAt =
    typeof rawExpiresAt === "number"
      ? rawExpiresAt
      : typeof rawExpiresAt === "string"
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
  const [imageLoading, setImageLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  /* ---------- usuario ---------- */
  const user = useSelector(selectUser) as MaybeUser;

  /* ---------- descarga de la imagen ---------- */
  const fetchLoginImage = useCallback(async () => {
    setImageLoading(true);
    setImageLoaded(false);
    setLoginImage(null);

    try {
      const loginImageRef = ref(storage, LOGIN_IMAGE_PATH);
      const files = await listAll(loginImageRef);

      if (files.items.length > 0) {
        const url = await getDownloadURL(files.items[0]);
        setLoginImage(url);
      } else {
        setImageLoading(false);
      }
    } catch (err) {
      console.error("Error al cargar la imagen de login:", err);
      setImageLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLoginImage();
  }, [fetchLoginImage]);

  /* reinicio de flags si cambia la URL */
  useEffect(() => {
    if (loginImage) {
      setImageLoading(true);
      setImageLoaded(false);
    }
  }, [loginImage]);

  /* imagen ya en caché */
  useEffect(() => {
    if (
      imgRef.current &&
      imgRef.current.complete &&
      imgRef.current.naturalWidth > 0
    ) {
      setImageLoaded(true);
      setImageLoading(false);
    }
  }, [loginImage]);

  /* redirección si hay sesión */
  useEffect(() => {
    if (user) {
      navigate(HOME_PATH, { replace: true });
      return;
    }

    const storedSession = parseStoredSession(getStoredSession() as unknown);
    if (
      storedSession &&
      Date.now() < storedSession.sessionExpiresAt
    ) {
      navigate(HOME_PATH, { replace: true });
    }
  }, [user, navigate]);

  const goToHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100vw" }}>
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
                  animate={imageLoaded ? "visible" : "hidden"}
                  variants={imageVariants}
                  style={{ height: "100%", position: "relative" }}
                >
                  {imageLoading && (
                    <Skeleton.Image
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        borderRadius: "1em",
                        objectFit: "cover",
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
                        setImageLoaded(true);
                        setImageLoading(false);
                      }}
                      onError={() => {
                        console.error("No se pudo cargar la imagen:", loginImage);
                        setLoginImage(null);
                        setImageLoading(false);
                      }}
                      style={{ visibility: imageLoaded ? "visible" : "hidden" }}
                    />
                  </Imagen>
                </motion.div>
              )}

              {!loginImage && imageLoading && (
                <Skeleton.Image
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "1em",
                    objectFit: "cover",
                  }}
                  active
                />
              )}

              {!loginImage && !imageLoading && (
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
  background-color: #4d4d4d;
  height: 100vh;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
`;

const ButtonBack = styled(Button)`
  position: absolute;
  cursor: pointer;
  display: flex;
  top: 2em;
  left: 2em;
  align-items: center;
  z-index: 10;
  gap: 0.5em;
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
  padding: 1em;
  height: 100%;
  max-height: min(800px, 100vh);
  position: relative;
  padding-right: 0;

  @media (max-width: 800px) {
    display: none;
  }
`;

const NoImageMsg = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #777;
  border-radius: 1em;
  color: #ccc;
  background: rgba(0, 0, 0, 0.2);
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1366px;
  max-height: min(800px, 100vh);
  height: 100%;
  margin: 0 auto;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    justify-content: center;
    justify-items: center;
  }
`;
