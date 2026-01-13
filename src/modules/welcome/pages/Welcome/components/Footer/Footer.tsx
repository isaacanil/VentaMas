// @ts-nocheck
// Importa React, styled-components y los componentes de antd que necesitarás
import { HeartFilled } from '@/constants/icons/antd';
import { Row, Col, Divider } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

// Componente Footer
export const Footer = () => {
  const footerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.3 },
    },
  };

  return (
    <FooterContainer
      as={motion.footer}
      variants={footerVariants}
      initial="hidden"
      animate="visible"
    >
      <FooterContent>
        <Row gutter={[32, 32]} justify="space-between">
          {/* Company Info */}
          <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <FooterTitle>Ventamax</FooterTitle>
              <FooterText>
                Sistema completo de punto de venta diseñado para optimizar la
                gestión de tu negocio con tecnología de vanguardia.
              </FooterText>
              {/* <SocialLinksContainer
                as={motion.div}
                variants={socialVariants}
                initial="hidden"
                animate="visible"
              >
                <SocialLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href={WelcomeData.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FacebookOutlined />
                </SocialLink>
                <SocialLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href={WelcomeData.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <TwitterOutlined />
                </SocialLink>
                <SocialLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href={WelcomeData.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramOutlined />
                </SocialLink>
                <SocialLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href={WelcomeData.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkedinOutlined />
                </SocialLink>
              </SocialLinksContainer> */}
            </FooterSection>
          </Col>

          {/* Quick Links */}
          {/* <Col xs={24} sm={12} md={4}>
            <FooterSection>
              <FooterTitle>Enlaces Rápidos</FooterTitle>
              <FooterLinksList>
                <FooterLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href="#features"
                >
                  Características
                </FooterLink>
                <FooterLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href="#pricing"
                >
                  Precios
                </FooterLink>
                <FooterLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href="#support"
                >
                  Soporte
                </FooterLink>
                <FooterLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href="#about"
                >
                  Acerca de
                </FooterLink>
              </FooterLinksList>
            </FooterSection>
          </Col> */}

          {/* Legal */}
          {/* <Col xs={24} sm={12} md={4}>
            <FooterSection>
              <FooterTitle>Legal</FooterTitle>
              <FooterLinksList>
                <FooterLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href="/privacy"
                >
                  Política de Privacidad
                </FooterLink>
                <FooterLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href="/terms"
                >
                  Términos de Uso
                </FooterLink>
                <FooterLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href="/cookies"
                >
                  Política de Cookies
                </FooterLink>
                <FooterLink
                  as={motion.a}
                  variants={linkVariants}
                  whileHover="hover"
                  href="/gdpr"
                >
                  GDPR
                </FooterLink>
              </FooterLinksList>
            </FooterSection>
          </Col> */}

          {/* Contact Info */}
          {/* <Col xs={24} sm={12} md={6}>
            <FooterSection>
              <FooterTitle>Contacto</FooterTitle>
              <ContactItem>
                <ContactIcon>
                  <PhoneOutlined />
                </ContactIcon>
                <ContactText>{WelcomeData.contact.phone}</ContactText>
              </ContactItem>
              <ContactItem>
                <ContactIcon>
                  <MailOutlined />
                </ContactIcon>
                <ContactText>{WelcomeData.contact.email}</ContactText>
              </ContactItem>
              <ContactItem>
                <ContactIcon>
                  <GlobalOutlined />
                </ContactIcon>
                <ContactText>{WelcomeData.contact.website}</ContactText>
              </ContactItem>
              <NewsletterContainer>
                <FooterText style={{ marginBottom: '12px', fontWeight: '500' }}>
                  Suscríbete a nuestro boletín
                </FooterText>
                <NewsletterButton type="primary" size="small">
                  Suscribirse
                </NewsletterButton>
              </NewsletterContainer>
            </FooterSection>
          </Col> */}
        </Row>

        <Divider style={{ borderColor: '#e1e5e9', margin: '32px 0 24px' }} />

        {/* Copyright */}
        <CopyrightSection>
          <Row justify="space-between" align="middle">
            <Col xs={24} md={12}>
              <CopyrightText>
                © {new Date().getFullYear()} Ventamax - Todos los derechos
                reservados
              </CopyrightText>
            </Col>
            <Col xs={24} md={12}>
              <DeveloperText>
                Desarrollado con{' '}
                <HeartFilled style={{ color: '#ff4d4f', margin: '0 4px' }} />{' '}
                por Gisys
              </DeveloperText>
            </Col>
          </Row>
        </CopyrightSection>
      </FooterContent>
    </FooterContainer>
  );
};

// Crea estilos personalizados para tu footer usando styled-components
const FooterContainer = styled.footer`
  position: relative;
  padding: 60px 0 20px;
  margin-top: auto;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #dee2e6;

  &::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 3px;
    content: '';
    background: linear-gradient(90deg, #1890ff, #722ed1, #eb2f96);
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  padding: 0 24px;
  margin: 0 auto;
`;

const FooterSection = styled.div`
  margin-bottom: 24px;
`;

const FooterTitle = styled.h4`
  position: relative;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary, #1890ff);

  &::after {
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 30px;
    height: 2px;
    content: '';
    background: linear-gradient(90deg, #1890ff, #722ed1);
    border-radius: 1px;
  }
`;

const FooterText = styled.p`
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #666;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CopyrightSection = styled.div`
  text-align: center;

  @media (width >= 768px) {
    text-align: left;
  }
`;

const CopyrightText = styled.span`
  font-size: 13px;
  color: #999;

  @media (width <= 767px) {
    display: block;
    margin-bottom: 8px;
  }
`;

const DeveloperText = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #999;

  @media (width >= 768px) {
    justify-content: flex-end;
  }
`;
