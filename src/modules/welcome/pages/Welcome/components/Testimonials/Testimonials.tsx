import { faUser, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Row, Col, Typography, Rate, Avatar } from 'antd';
import { m, type Variants } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

import { welcomeData } from '../../welcomeData';

const { Title, Paragraph, Text } = Typography;

const Testimonials = () => {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <TestimonialsSection
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={container}
    >
      <Container>
        <HeaderSection
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Title
            level={2}
            style={{
              textAlign: 'center',
              color: 'white',
              marginBottom: '1rem',
            }}
          >
            Lo que dicen nuestros clientes
          </Title>
          <Paragraph
            style={{
              textAlign: 'center',
              fontSize: '1.1rem',
              color: '#e2e8f0',
            }}
          >
            Miles de empresarios confían en Ventamax para hacer crecer sus
            negocios
          </Paragraph>
        </HeaderSection>

        <Row gutter={[32, 32]} justify="center">
          {welcomeData.testimonials.map((testimonial) => (
            <Col xs={24} lg={12} key={testimonial.id}>
              <TestimonialCard
                variants={item}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  style={{
                    height: '100%',
                    border: 'none',
                    borderRadius: '20px',
                    background:
                      'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                    boxShadow:
                      '0 20px 25px -5px rgb(0 0 0 / 10%), 0 10px 10px -5px rgb(0 0 0 / 4%)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  styles={{
                    body: {
                      padding: '32px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    },
                  }}
                >
                  {' '}
                  <QuoteIcon>
                    <FontAwesomeIcon icon={faQuoteLeft} />
                  </QuoteIcon>
                  <div>
                    <Rate
                      disabled
                      defaultValue={testimonial.rating}
                      style={{
                        marginBottom: '20px',
                        fontSize: '18px',
                        color: '#faad14',
                      }}
                    />

                    <TestimonialText>
                      &ldquo;{testimonial.comment}&rdquo;
                    </TestimonialText>
                  </div>
                  <CustomerInfo>
                    {' '}
                    <Avatar
                      size={48}
                      icon={<FontAwesomeIcon icon={faUser} />}
                      style={{
                        background:
                          'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                        marginRight: '16px',
                      }}
                    />
                    <div>
                      <CustomerName>{testimonial.name}</CustomerName>
                      <BusinessName>{testimonial.business}</BusinessName>
                    </div>
                  </CustomerInfo>
                </Card>
              </TestimonialCard>
            </Col>
          ))}
        </Row>

        <CTASection
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <CTACard>
            <Title
              level={3}
              style={{
                color: 'white',
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              ¿Listo para transformar tu negocio?
            </Title>
            <Paragraph
              style={{
                textAlign: 'center',
                color: '#e2e8f0',
                fontSize: '1.1rem',
                marginBottom: '2rem',
              }}
            >
              Únete a más de 10,000 empresarios que ya confían en Ventamax
            </Paragraph>
            <CTAButtons>
              <PrimaryButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {welcomeData.cta.primary}
              </PrimaryButton>
              <SecondaryButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {welcomeData.cta.trial}
              </SecondaryButton>
            </CTAButtons>
          </CTACard>
        </CTASection>
      </Container>
    </TestimonialsSection>
  );
};

// Styled Components
const TestimonialsSection = styled(m.section)`
  position: relative;
  padding: 100px 0;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &::before {
    position: absolute;
    inset: 0;
    content: '';
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.1"/></svg>')
      repeat;
    background-size: 100px 100px;
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

const HeaderSection = styled(m.div)`
  margin-bottom: 80px;
`;

const TestimonialCard = styled(m.div)`
  height: 100%;
  cursor: pointer;
`;

const QuoteIcon = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 32px;
  color: #e2e8f0;
  opacity: 0.6;
`;

const TestimonialText = styled(Paragraph)`
  margin-bottom: 24px !important;
  font-size: 1.1rem !important;
  font-style: italic;
  line-height: 1.6 !important;
  color: #374151 !important;
`;

const CustomerInfo = styled.div`
  display: flex;
  align-items: center;
  margin-top: 24px;
`;

const CustomerName = styled(Text)`
  display: block;
  font-size: 1rem !important;
  font-weight: 600 !important;
  color: #1f2937 !important;
`;

const BusinessName = styled(Text)`
  font-size: 0.9rem !important;
  color: #64748b !important;
`;

const CTASection = styled(m.div)`
  margin-top: 80px;
`;

const CTACard = styled.div`
  padding: 48px 32px;
  text-align: center;
  background: linear-gradient(
    135deg,
    rgb(255 255 255 / 10%) 0%,
    rgb(255 255 255 / 5%) 100%
  );
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 24px;
  backdrop-filter: blur(10px);

  @media (width <= 768px) {
    padding: 32px 20px;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
`;

const PrimaryButton = styled(m.button)`
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
  border: none;
  border-radius: 50px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 10%);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 10%);
  }
`;

const SecondaryButton = styled(m.button)`
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  background: transparent;
  border: 2px solid rgb(255 255 255 / 30%);
  border-radius: 50px;
  transition: all 0.2s ease;

  &:hover {
    background: rgb(255 255 255 / 10%);
    border-color: rgb(255 255 255 / 50%);
  }
`;

export default Testimonials;
