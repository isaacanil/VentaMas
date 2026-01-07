// VentamaxLoader.js
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import React, { useCallback, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

import logo from './ventamax.svg';

// registra los plugins una sola vez
gsap.registerPlugin(SplitText);

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const SplashWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  user-select: none;
  background: #000;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 3rem;
  font-weight: 800;
  color: #0090ff; /* azul Ventamax */
  letter-spacing: 0.02em;
`;

const Subtitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 400;
  color: #d1d1d1; /* gris suave */
  text-transform: uppercase;
  letter-spacing: 0.25em;
`;

const getThemeStyles = (theme) => {
  const themes = {
    dark: { textColor: '#fff' },
    light: { textColor: '#000' },
  };
  return themes[theme] || themes.dark;
};

const SplashMessage = styled.p`
  max-width: 320px;
  margin: 1.5rem 0 0;
  font-size: 1rem;
  line-height: 1.5;
  color: ${({ theme }) => getThemeStyles(theme).textColor};
  text-align: center;
`;

const MinimalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 24px;
  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
  background: linear-gradient(
    180deg,
    rgb(15 23 42 / 0%) 0%,
    rgb(15 23 42 / 12%) 45%,
    rgb(15 23 42 / 28%) 100%
  );
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transition: opacity 0.3s ease;
`;

const MinimalCard = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  max-width: min(420px, calc(100vw - 48px));
  padding: 14px 20px;
  color: #fff;
  background: rgb(15 23 42 / 78%);
  border-radius: 18px;
  box-shadow: 0 24px 48px rgb(15 23 42 / 35%);
  backdrop-filter: blur(10px);
`;

const MinimalLogo = styled.img`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  object-fit: contain;
`;

const MinimalMessage = styled.p`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
  color: #ebf4ff;
`;

// --- SYSTEM/SESSION LOADER COMPONENTS ---

const SystemOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  padding: 24px;
  align-items: center;
  justify-content: center;
  background: #000;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transition: opacity 0.3s ease;
  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
`;

const SystemLogo = styled.img`
  width: 120px;
  margin-bottom: 40px;
  animation: ${pulse} 3s ease-in-out infinite;
`;

const SystemSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-primary, #667eea);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const SystemLoadingText = styled.p`
  margin-top: 24px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  letter-spacing: 1px;
  opacity: 0.9;
`;

const ErrorContainer = styled.div`
  max-width: 500px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  text-align: center;
`;

const ErrorTitle = styled.h2`
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 700;
  color: #e53e3e;
`;

const ErrorMessage = styled.p`
  margin-bottom: 24px;
  line-height: 1.6;
  color: #4a5568;
`;

const RetryButton = styled.button`
  padding: 12px 28px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: var(--color-primary, #667eea);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;

const VentamaxSystemLoader = ({ active, message, error, status }) => {
  const handleRetry = () => {
    window.location.reload();
  };

  const isError = status === 'error';

  return (
    <SystemOverlay $active={active}>
      {isError ? (
        <ErrorContainer>
          <ErrorTitle>Error de Sesión</ErrorTitle>
          <ErrorMessage>
            {error?.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
          </ErrorMessage>
          <RetryButton onClick={handleRetry}>Reintentar</RetryButton>
        </ErrorContainer>
      ) : (
        <>
          <SystemLogo src={logo} alt="Ventamax Logo" />
          <SystemSpinner />
          <SystemLoadingText>{message || 'Cargando sesión...'}</SystemLoadingText>
        </>
      )}
    </SystemOverlay>
  );
};

const VentamaxMinimalLoader = ({ active, message, onFinish, status }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const onFinishRef = useRef(onFinish);
  const finishCalledRef = useRef(false);
  const wasActiveRef = useRef(active);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const wasActive = wasActiveRef.current;
    wasActiveRef.current = active;

    if (active) {
      finishCalledRef.current = false;
      return;
    }

    // Solo finalizar si realmente veníamos de activo -> inactivo
    if (wasActive && prefersReducedMotion && !finishCalledRef.current) {
      finishCalledRef.current = true;
      onFinishRef.current?.();
    }
  }, [active, prefersReducedMotion]);

  const statusMessage = message || 'Iniciando sesión...';

  return (
    <MinimalOverlay
      $active={active}
      aria-live={active ? 'polite' : 'off'}
      aria-busy={active}
      aria-hidden={!active}
      role={active ? 'status' : undefined}
      data-status={status}
      style={{ transition: prefersReducedMotion ? 'none' : undefined }}
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.propertyName !== 'opacity') return;
        if (active) return;
        if (finishCalledRef.current) return;
        finishCalledRef.current = true;
        onFinishRef.current?.();
      }}
    >
      <MinimalCard>
        <MinimalLogo src={logo} alt="Ventamax logo" />
        {statusMessage && <MinimalMessage>{statusMessage}</MinimalMessage>}
      </MinimalCard>
    </MinimalOverlay>
  );
};

const VentamaxSplashLoader = ({ active, message, onFinish, status }) => {
  const wrapperRef = useRef(null);
  const logoRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const fadeTimelineRef = useRef(null);
  const activeRef = useRef(active);
  const introCompletedRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const runFadeOut = useCallback(() => {
    if (prefersReducedMotion) {
      onFinishRef.current?.();
      return;
    }

    if (!wrapperRef.current) return;

    fadeTimelineRef.current?.kill();
    fadeTimelineRef.current = gsap.to(wrapperRef.current, {
      autoAlpha: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        fadeTimelineRef.current = null;
        onFinishRef.current?.();
      },
    });
  }, [prefersReducedMotion]);

  useGSAP(
    () => {
      if (prefersReducedMotion) {
        introCompletedRef.current = true;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => { };
      }

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      if (!titleRef.current) return () => { };

      const split = new SplitText(titleRef.current, { type: 'chars' });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          introCompletedRef.current = true;
          if (!activeRef.current) {
            runFadeOut();
          }
        },
      });

      tl.from(wrapperRef.current, { autoAlpha: 0, duration: 0.4 });

      tl.fromTo(
        logoRef.current,
        { scale: 0.85 },
        {
          scale: 1.4,
          duration: 0.9,
          yoyo: true,
          repeat: 1,
          ease: 'elastic.out(1, 0.45)',
        },
        '<',
      );

      tl.from(
        split.chars,
        { yPercent: 120, opacity: 0, duration: 0.6, stagger: 0.04 },
        '+=0.2',
      );

      tl.from(subRef.current, { y: 20, opacity: 0, duration: 0.5 }, '-=0.35');

      return () => {
        introCompletedRef.current = false;
        tl.kill();
        split.revert();
      };
    },
    { dependencies: [prefersReducedMotion, runFadeOut] },
  );

  useEffect(() => {
    activeRef.current = active;
    if (!active && introCompletedRef.current) {
      runFadeOut();
    }
  }, [active, runFadeOut]);

  useEffect(() => {
    return () => {
      fadeTimelineRef.current?.kill();
      fadeTimelineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion && !activeRef.current) {
      onFinishRef.current?.();
    }
  }, [prefersReducedMotion]);

  const statusMessage = message || 'Cargando Ventamax...';

  return (
    <SplashWrapper
      ref={wrapperRef}
      aria-live="assertive"
      aria-busy={active}
      role="status"
      data-status={status}
    >
      <img ref={logoRef} src={logo} alt="Ventamax logo" width={120} />
      <Title ref={titleRef}>Ventamax</Title>
      <Subtitle ref={subRef}>by&nbsp;gysys</Subtitle>
      {statusMessage && <SplashMessage>{statusMessage}</SplashMessage>}
    </SplashWrapper>
  );
};

export default function VentamaxLoader(props) {
  if (props.variant === 'minimal') {
    return <VentamaxMinimalLoader {...props} active={props.active ?? props.show} />;
  }

  if (props.variant === 'system' || props.variant === 'session') {
    return <VentamaxSystemLoader {...props} active={props.active ?? props.show} />;
  }

  return <VentamaxSplashLoader {...props} active={props.active ?? props.show} />;
}
