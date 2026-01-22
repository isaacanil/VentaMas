import {
  ShopOutlined,
  DollarOutlined,
  BarChartOutlined,
  TeamOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
  StarOutlined,
  CheckCircleOutlined,
} from '@/constants/icons/antd';
import { Card, Row, Col, Typography } from 'antd';
import { motion } from 'framer-motion';
import styled from 'styled-components';

import welcomeDataRaw from '../../WelcomeData.json';
import type { WelcomeData, WelcomeFeature } from '../../types';

const welcomeData: WelcomeData = welcomeDataRaw;

const { Title, Paragraph } = Typography;

const Features = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const getIcon = (iconName: WelcomeFeature['icon']) => {
    const iconsMap = {
      ShopOutlined,
      DollarOutlined,
      BarChartOutlined,
      TeamOutlined,
      SafetyOutlined,
      CustomerServiceOutlined,
    };
    const IconComponent = iconsMap[iconName];
    return IconComponent ? <IconComponent /> : <StarOutlined />;
  };

  return (
    <FeaturesSection
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={container}
    >
      <Container>
        <HeaderSection
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Title
            level={2}
            style={{ textAlign: 'center', marginBottom: '1rem' }}
          >
            ¿Por qué elegir Ventamax?
          </Title>
          <Paragraph
            style={{
              textAlign: 'center',
              fontSize: '1.1rem',
              color: '#64748b',
            }}
          >
            Descubre todas las características que harán crecer tu negocio
          </Paragraph>
        </HeaderSection>

        <Row gutter={[24, 24]}>
          {welcomeData.features.map((feature) => (
            <Col xs={24} sm={12} lg={8} key={feature.id}>
              <FeatureCard
                variants={item}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    border: 'none',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background:
                      'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                    boxShadow:
                      '0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -1px rgb(0 0 0 / 6%)',
                  }}
                  styles={{
                    body: {
                      padding: '32px 24px',
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    },
                  }}
                >
                  <div>
                    <IconContainer $color={feature.color}>
                      {getIcon(feature.icon)}
                    </IconContainer>
                    <Title
                      level={4}
                      style={{ margin: '16px 0 12px', color: '#1f2937' }}
                    >
                      {feature.title}
                    </Title>
                    <Paragraph style={{ color: '#64748b', lineHeight: '1.6' }}>
                      {feature.description}
                    </Paragraph>
                  </div>
                </Card>
              </FeatureCard>
            </Col>
          ))}
        </Row>

        <BenefitsSection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Title
            level={3}
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            Beneficios Comprobados
          </Title>
          <BenefitsList>
            {welcomeData.benefits.map((benefit, index) => (
              <BenefitItem
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CheckCircleOutlined
                  style={{
                    color: '#52c41a',
                    marginRight: '12px',
                    fontSize: '18px',
                  }}
                />
                <span>{benefit}</span>
              </BenefitItem>
            ))}
          </BenefitsList>
        </BenefitsSection>
      </Container>
    </FeaturesSection>
  );
};

// Styled Components
const FeaturesSection = styled(motion.section)`
  position: relative;
  padding: 80px 0;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);

  &::before {
    position: absolute;
    inset: 0;
    content: '';
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="1" fill="%23e2e8f0" opacity="0.5"/></svg>')
      repeat;
    background-size: 50px 50px;
    opacity: 0.3;
  }
`;

const Container = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  padding: 0 24px;
  margin: 0 auto;

  @media (width <= 768px) {
    padding: 0 16px;
  }
`;

const HeaderSection = styled(motion.div)`
  margin-bottom: 60px;
`;

const FeatureCard = styled(motion.div)`
  height: 100%;
  cursor: pointer;

  .ant-card {
    transition: all 0.3s ease;
  }

  &:hover .ant-card {
    box-shadow:
      0 20px 25px -5px rgb(0 0 0 / 10%),
      0 10px 10px -5px rgb(0 0 0 / 4%);
  }
`;

interface IconContainerProps {
  $color: string;
}

const IconContainer = styled.div<IconContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  font-size: 28px;
  color: ${({ $color }) => $color};
  background: ${({ $color }) =>
    `linear-gradient(135deg, ${$color}15 0%, ${$color}25 100%)`};
  border: 2px solid ${({ $color }) => `${$color}30`};
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ $color }) =>
    `linear-gradient(135deg, ${$color}25 0%, ${$color}35 100%)`};
    transform: rotate(5deg) scale(1.1);
  }
`;

const BenefitsSection = styled(motion.div)`
  padding: 40px;
  margin-top: 80px;
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
  border-radius: 20px;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 10%),
    0 4px 6px -2px rgb(0 0 0 / 5%);

  @media (width <= 768px) {
    padding: 24px 16px;
    margin-top: 60px;
  }
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const BenefitItem = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    transform: translateX(4px);
  }
`;

export default Features;
