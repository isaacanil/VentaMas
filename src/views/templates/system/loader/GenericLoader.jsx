// VentamaxLoader.js
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import logo from './ventamax.svg';

// registra los plugins una sola vez
gsap.registerPlugin(SplitText);

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

const usePrefersReducedMotion = () => {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = (event) => {
      setPrefers(event.matches);
    };

    setPrefers(mediaQuery.matches);
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  return prefers;
};

const MINIMAL_FADE_DURATION = 260;

const VentamaxMinimalLoader = ({ active, message, onFinish, status }) => {
  const [isRendered, setIsRendered] = useState(active);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (active) {
      setIsRendered(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setIsRendered(false);
      timeoutRef.current = null;
      onFinish?.();
    }, MINIMAL_FADE_DURATION);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [active, onFinish]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isRendered && !active) {
    return null;
  }

  const statusMessage = message || 'Iniciando sesi├│n...';

  return (
    <MinimalOverlay
      $active={active}
      aria-live="assertive"
      aria-busy={active}
      role="status"
      data-status={status}
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
        return () => {};
      }

      if (!titleRef.current) return () => {};

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
    return <VentamaxMinimalLoader {...props} />;
  }

  return <VentamaxSplashLoader {...props} />;
}
