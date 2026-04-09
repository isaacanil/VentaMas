import {
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from '@/constants/icons/antd';
import { Button, Card, Space } from 'antd';
import { m, type Variants } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { Logo } from '@/assets/logo/Logo';
import type { WelcomeData } from '../../../types';

interface CardWelcomeProps {
  welcomeData: WelcomeData;
}

export const CardWelcome = ({ welcomeData }: CardWelcomeProps) => {
  const loginPath = '/login';
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const features = [
    { icon: <RocketOutlined />, text: 'Rápido y eficiente' },
    { icon: <SafetyOutlined />, text: 'Seguro y confiable' },
    { icon: <ThunderboltOutlined />, text: 'Fácil de usar' },
    { icon: <StarOutlined />, text: 'Soporte 24/7' },
  ];

  return (
    <Container variants={cardVariants} initial="hidden" animate="visible">
      <MainContent>
        <HeroCard>
          <m.div variants={itemVariants}>
            <AppName>Ventamax</AppName>
          </m.div>

          <m.div variants={itemVariants}>
            <Subtitle>Sistema de Punto de Venta Profesional</Subtitle>
          </m.div>

          <m.div variants={itemVariants}>
            <Description>
              Eleva tu negocio al siguiente nivel con herramientas avanzadas,
              análisis profundos y soporte especializado. La solución completa
              para profesionales en ventas.
            </Description>
          </m.div>

          <m.div variants={itemVariants}>
            <FeaturesGrid>
              {features.map((feature) => (
                <FeatureItem key={feature.text}>
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <FeatureText>{feature.text}</FeatureText>
                </FeatureItem>
              ))}
            </FeaturesGrid>
          </m.div>

          <m.div variants={itemVariants}>
            <ButtonContainer>
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => handleNavigate(loginPath)}
              >
                Comenzar ahora
              </Button>
            </ButtonContainer>
          </m.div>
        </HeroCard>
      </MainContent>
      <LogoContainer variants={itemVariants}>
        <LogoBG>
          <Logo size="xlarge" src={welcomeData?.logo} alt="Ventamax Logo" />
        </LogoBG>
      </LogoContainer>{' '}
    </Container>
  );
};

const Container = styled(m.div)`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4rem;
  align-items: center;
  max-width: 1200px;
  padding: 3rem 2rem;
  margin: 0 auto;

  @media (width <= 1024px) {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
  }

  @media (width <= 768px) {
    gap: 2rem;
    padding: 2rem 1rem;
  }
`;

const MainContent = styled.div`
  max-width: 600px;

  @media (width <= 1024px) {
    order: 2;
    max-width: none;
  }
`;

const HeroCard = styled(Card)`
  padding: 2rem;
  background: linear-gradient(145deg, #fff 0%, #f8fafc 100%);
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgb(0 0 0 / 10%);

  .ant-card-body {
    padding: 0;
  }

  @media (width <= 768px) {
    padding: 1.5rem;
  }
`;

const AppName = styled.h1`
  margin-bottom: 0.5rem !important;
  font-size: 3.5rem !important;
  font-weight: 800 !important;
  color: var(--color-primary, #1890ff) !important;
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (width <= 768px) {
    font-size: 2.5rem !important;
  }

  @media (width <= 480px) {
    font-size: 2rem !important;
  }
`;

const Subtitle = styled.h2`
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary, #262626);

  @media (width <= 768px) {
    font-size: 1.25rem;
  }
`;

const Description = styled.p`
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-text-secondary, #666);

  @media (width <= 768px) {
    margin-bottom: 1.5rem;
    font-size: 1rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (width <= 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  background: rgb(24 144 255 / 5%);
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgb(24 144 255 / 10%);
    transform: translateY(-2px);
  }
`;

const FeatureIcon = styled.span`
  font-size: 1.2rem;
  color: var(--color-primary, #1890ff);
`;

const FeatureText = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary, #262626);
`;

const ButtonContainer = styled(Space)`
  width: 100%;

  .ant-btn {
    height: 48px;
    font-weight: 600;
    border-radius: 8px;

    &.ant-btn-primary {
      background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
      border: none;
      box-shadow: 0 4px 15px rgb(24 144 255 / 30%);

      &:hover {
        background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
        box-shadow: 0 6px 20px rgb(24 144 255 / 40%);
        transform: translateY(-2px);
      }
    }
  }

  @media (width <= 480px) {
    flex-direction: column;
    width: 100%;

    .ant-btn {
      width: 100%;
    }
  }
`;

const LogoContainer = styled(m.div)`
  display: flex;
  align-items: center;
  justify-content: center;

  @media (width <= 1024px) {
    order: 1;
  }
`;

const LogoBG = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 50%;
  box-shadow: 0 15px 35px rgb(0 0 0 / 10%);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 20px 40px rgb(0 0 0 / 15%);
    transform: scale(1.05) rotate(5deg);
  }

  @media (width <= 768px) {
    padding: 2rem;
  }
`;
