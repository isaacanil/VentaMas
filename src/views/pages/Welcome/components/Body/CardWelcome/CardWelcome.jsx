import {
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Button, Card, Space } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { Logo } from '../../../../../../assets/logo/Logo';

export const CardWelcome = ({ welcomeData }) => {
  const loginPath = '/login';
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
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
    <Container
      as={motion.div}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <MainContent>
        <HeroCard>
          <motion.div variants={itemVariants}>
            <AppName level={1}>Ventamax</AppName>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Subtitle>Sistema de Punto de Venta Profesional</Subtitle>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Description>
              Eleva tu negocio al siguiente nivel con herramientas avanzadas,
              análisis profundos y soporte especializado. La solución completa
              para profesionales en ventas.
            </Description>
          </motion.div>

          <motion.div variants={itemVariants}>
            <FeaturesGrid>
              {features.map((feature, index) => (
                <FeatureItem key={index}>
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <FeatureText>{feature.text}</FeatureText>
                </FeatureItem>
              ))}
            </FeaturesGrid>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ButtonContainer>
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => handleNavigate(loginPath)}
              >
                Comenzar ahora
              </Button>
              {/* <Button
                                size="large"
                                onClick={() => handleNavigate('/demo')}
                            >
                                Ver demo
                            </Button> */}
            </ButtonContainer>
          </motion.div>
        </HeroCard>
      </MainContent>
      <LogoContainer as={motion.div} variants={itemVariants}>
        <LogoBG>
          <Logo size="xlarge" src={welcomeData?.logo} alt="Ventamax Logo" />
        </LogoBG>
      </LogoContainer>{' '}
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4rem;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
  }

  @media (max-width: 768px) {
    padding: 2rem 1rem;
    gap: 2rem;
  }
`;

const MainContent = styled.div`
  max-width: 600px;

  @media (max-width: 1024px) {
    order: 2;
    max-width: none;
  }
`;

const HeroCard = styled(Card)`
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;

  .ant-card-body {
    padding: 0;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const AppName = styled.h1`
  color: var(--color-primary, #1890ff) !important;
  font-weight: 800 !important;
  font-size: 3.5rem !important;
  margin-bottom: 0.5rem !important;
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 2.5rem !important;
  }

  @media (max-width: 480px) {
    font-size: 2rem !important;
  }
`;

const Subtitle = styled.h2`
  color: var(--color-text-primary, #262626);
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const Description = styled.p`
  color: var(--color-text-secondary, #666);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(24, 144, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const FeatureIcon = styled.span`
  color: var(--color-primary, #1890ff);
  font-size: 1.2rem;
`;

const FeatureText = styled.span`
  color: var(--color-text-primary, #262626);
  font-weight: 500;
  font-size: 0.9rem;
`;

const ButtonContainer = styled(Space)`
  width: 100%;

  .ant-btn {
    height: 48px;
    border-radius: 8px;
    font-weight: 600;

    &.ant-btn-primary {
      background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
      border: none;
      box-shadow: 0 4px 15px rgba(24, 144, 255, 0.3);

      &:hover {
        background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
      }
    }
  }

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;

    .ant-btn {
      width: 100%;
    }
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 1024px) {
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
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05) rotate(5deg);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 2rem;
  }
`;
