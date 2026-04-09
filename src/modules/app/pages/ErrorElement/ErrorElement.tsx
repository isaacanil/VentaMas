import {
  BugOutlined,
  HomeOutlined,
  RollbackOutlined,
} from '@/constants/icons/antd';
import { Button, Checkbox, Typography, Space, Alert } from 'antd';
import { AnimatePresence, m } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

import { Logo } from '@/assets/logo/Logo';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';

import { ErrorCard } from './components/ErrorCard';
import { ErrorDetails } from './components/ErrorDetails';
import { MESSAGES, ANIMATIONS } from './constants';
import { useErrorHandling } from './hooks/useErrorHandling';

const { Title: AntTitle, Text } = Typography;

interface ErrorElementProps {
  errorInfo?: string | null;
  errorStackTrace?: string | null;
}

export const ErrorElement = ({
  errorInfo,
  errorStackTrace,
}: ErrorElementProps) => {
  const {
    user,
    loading,
    canGoBack,
    handleBack,
    handleGoBack,
    handleReportChange,
  } = useErrorHandling(errorInfo, errorStackTrace);

  return (
    <Container
      variants={ANIMATIONS.container}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <ErrorCard>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <AnimatePresence>
            <LogoWrapper
              key="logo"
              variants={ANIMATIONS.logo}
              initial="hidden"
              animate="visible"
            >
              <Logo />
            </LogoWrapper>

            <StyledAlert
              key="alert"
              icon={<BugOutlined className="error-icon" />}
              message={
                <AntTitle level={4} style={{ margin: 0, color: '#cf1322' }}>
                  {MESSAGES.ERROR_TITLE}
                </AntTitle>
              }
              description={<Text>{MESSAGES.ERROR_DESCRIPTION}</Text>}
              type="error"
              showIcon
            />

            <ReportSection key="report">
              <Checkbox onChange={handleReportChange}>
                <Text strong>{MESSAGES.REPORT_ERROR}</Text>
              </Checkbox>
              <Text type="secondary" className="report-description">
                {MESSAGES.REPORT_DESCRIPTION}
              </Text>
            </ReportSection>

            <ButtonGroup key="actions">
              {canGoBack && (
                <Button
                  icon={<RollbackOutlined />}
                  onClick={handleGoBack}
                  size="large"
                  className="back-button"
                >
                  {MESSAGES.GO_BACK}
                </Button>
              )}
              <Button
                type="primary"
                size="large"
                icon={<HomeOutlined />}
                onClick={handleBack}
                loading={loading}
                className="home-button"
              >
                {MESSAGES.GO_HOME}
              </Button>
            </ButtonGroup>
            {hasDeveloperAccess(user) && (
              <ErrorDetails
                key="details"
                errorStackTrace={errorStackTrace}
                variants={ANIMATIONS.errorDetails}
              />
            )}
          </AnimatePresence>
        </Space>
      </ErrorCard>
    </Container>
  );
};

ErrorElement.propTypes = {
  errorInfo: PropTypes.string,
  errorStackTrace: PropTypes.string,
};

// --- STYLED COMPONENTS ACTUALIZADOS ---

const Container = styled(m.div)`
  display: flex;
  flex-direction: column;
  align-items: center; /* Centrado vertical */
  justify-content: center; /* Centrado horizontal */
  min-height: 100vh;
  width: 100%;
  background-color: #f8f9fa; /* Fondo gris suave para contexto */
  padding: 20px;
  overflow-y: auto;
`;

const LogoWrapper = styled(m.div)`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  filter: drop-shadow(0 4px 6px rgb(0 0 0 / 10%));
`;

const StyledAlert = styled(Alert)`
  margin: 1.5rem 0;
  border: none;
  border-left: 4px solid #ff4d4f; /* Borde de acento elegante */
  border-radius: 4px;
  background: #fff1f0;
  box-shadow: none; /* Eliminamos sombra para diseño plano */

  .error-icon {
    font-size: 24px;
    color: #ff4d4f;
    margin-top: 4px;
  }

  .ant-alert-message {
    margin-bottom: 4px;
  }
`;

const ReportSection = styled(Space)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  padding: 1rem 1.5rem;
  width: 100%;

  /* Diseño sutil y técnico */
  background: rgb(0 0 0 / 2%);
  border: 1px dashed #d9d9d9;
  border-radius: 8px;

  /* Sin sombras pesadas */

  .report-description {
    padding-left: 24px;
    font-size: 0.85rem;
    opacity: 0.85;
  }

  .ant-checkbox-wrapper:hover {
    opacity: 0.8;
  }
`;

const ButtonGroup = styled(Space)`
  gap: 16px !important;
  justify-content: center;
  width: 100%;
  margin-top: 2rem;
  flex-wrap: wrap; /* Para móviles */

  button {
    height: 48px;
    padding: 0 32px;
    border-radius: 12px; /* Bordes más modernos */
    font-weight: 500;
    box-shadow: 0 4px 10px rgb(0 0 0 / 5%);
  }

  .back-button {
    border: 1px solid #d9d9d9;
    background: white;
    transition: all 0.3s ease;

    &:hover {
      border-color: #40a9ff;
      color: #40a9ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    }
  }

  .home-button {
    /* Gradiente sutil */
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    border: none;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgb(24 144 255 / 40%); /* Glow azul */
    }
  }
`;

export default ErrorElement;
