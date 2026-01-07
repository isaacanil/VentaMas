// @ts-nocheck
import React from 'react';
import styled, { keyframes } from 'styled-components';

import { Logo } from '@/assets/logo/Logo';

export const LogoContainer = () => {
  return (
    <Container>
      <Branding>
        <BrandBadge>
          <BadgeLogo />
          <BrandCopy>
            <BadgeOverline>Facturación en línea</BadgeOverline>
            <BrandName>VENTAMAX</BrandName>
          </BrandCopy>
        </BrandBadge>
      </Branding>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(0.4rem, 1vw, 0.6rem)',
          maxWidth: '460px',
        }}
      >
        <Headline>Bienvenido</Headline>
        <Description>
          Impulsa tu facturación con una plataforma en la nube ágil, segura y
          lista para usar desde el primer día.
        </Description>
      </div>
    </Container>
  );
};

const badgeExpand = keyframes`
    0% {
        max-width: clamp(60px, 5vw, 60px);
        opacity: 0;
        padding-right: clamp(0.7rem, 0.7rem, 0.7rem);
    }

    55% {
        max-width: min(100%, 392px);
        opacity: 1;
    }

    100% {
        max-width: min(100%, 360px);
        opacity: 1;
        padding-right: clamp(1.5rem, 1.5rem, 1.5rem);
    }
`;

const logoPop = keyframes`
    0% {
        opacity: 0;
        transform: scale(0.7);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
`;

const copyReveal = keyframes`
    0% {
        opacity: 0;
        transform: translateY(12px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
`;

const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: clamp(0.8rem, 1.2vw, 1.4rem);
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding-top: clamp(1.25rem, 5vh, 2rem);
  margin-bottom: clamp(0.8rem, 1.8vw, 1.2rem);
  color: #fff;
  text-align: center;
  backdrop-filter: blur(16px);
`;

const Branding = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const BrandBadge = styled.div`
  display: flex;
  gap: clamp(0.45rem, 1vw, 0.75rem);
  align-items: center;
  max-width: min(100%, 360px);
  padding: clamp(0.4rem, 0.4rem, 0.4rem) clamp(1.5rem, 1.5rem, 1.5rem)
    clamp(0.4rem, 0.4rem, 0.4rem) clamp(0.7rem, 0.7rem, 0.7rem);
  margin-bottom: clamp(0.6rem, 1.5vw, 1rem);
  overflow: hidden;
  background: rgb(15 19 35 / 32%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 999px;
  backdrop-filter: blur(18px);
  animation: ${badgeExpand} 900ms cubic-bezier(0.76, 0, 0.24, 1) forwards;
  animation-delay: 120ms;
  will-change: max-width, padding-right, opacity;

  @media (width <= 620px) {
    flex-direction: column;
    gap: 0.6rem;
    align-items: center;
    justify-content: center;
    max-width: min(100%, 360px);
    padding: 0.75rem 1rem;
    border-radius: 16px;
    opacity: 1;
    animation: none;
  }

  @media (prefers-reduced-motion: reduce) {
    max-width: min(100%, 360px);
    padding-right: clamp(1.5rem, 1.5rem, 1.5rem);
    opacity: 1;
    animation: none;
  }
`;

const BadgeLogo = styled(Logo).attrs({
  customSize: 'clamp(50px, 5vw, 60px)',
})`
  display: block;
  opacity: 0;
  transform: scale(0.7);
  animation: ${logoPop} 420ms ease-out forwards;
  animation-delay: 240ms;
  will-change: transform, opacity;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    animation: none;
  }
`;

const BrandCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: left;
  opacity: 0;
  transform: translateY(12px);
  animation: ${copyReveal} 360ms ease-out forwards;
  animation-delay: 620ms;
  will-change: transform, opacity;

  @media (width <= 620px) {
    align-items: center;
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    animation: none;
  }
`;

const BadgeOverline = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  opacity: 0.78;
`;

const BrandName = styled.h1`
  margin: 0;
  font-size: clamp(1.18rem, 2.1vw, 1.5rem);
  font-weight: 800;
  letter-spacing: 0.07em;
`;

const Headline = styled.h2`
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 1.9rem);
  font-weight: 700;
  color: var(--color, #54c0a8);
  text-shadow: 0 2px 6px rgb(84 192 168 / 28%);
`;

const Description = styled.p`
  max-width: 460px;
  margin: 0;
  font-size: clamp(0.9rem, 2vw, 0.96rem);
  line-height: 1.45;
  color: rgb(255 255 255 / 92%);

  @media (width <= 620px) {
    font-size: clamp(0.85rem, 2.2vw, 0.92rem);
  }
`;
