import { BugOutlined, HomeOutlined, RollbackOutlined } from '@ant-design/icons';
import * as antd from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

import { Logo } from '../../../assets/logo/Logo';

import { ErrorCard } from './components/ErrorCard';
import { ErrorDetails } from './components/ErrorDetails';
import { MESSAGES, ANIMATIONS } from './constants';
import { useErrorHandling } from './hooks/useErrorHandling';

const { Button, Checkbox, Typography, Space, Alert } = antd;
const { Title: AntTitle, Text } = Typography;

export const ErrorElement = ({ errorInfo, errorStackTrace }) => {
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
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
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
                <AntTitle level={4} style={{ margin: 0 }}>
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
            {user?.role === 'dev' && (
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

const Container = styled(motion.div)`
  display: flex;
  justify-content: center;
  height: 100vh;
  overflow-y: auto;
`;

const LogoWrapper = styled(motion.div)`
  display: flex;
  justify-content: center;
  margin-bottom: 2.5rem;
  filter: drop-shadow(0 4px 8px rgb(0 0 0 / 10%));
`;

const StyledAlert = styled(Alert)`
  margin: 1em 0;
  border: 1px solid rgb(255 0 0 / 10%);
  border-radius: 12px;
  box-shadow: 0 8px 16px rgb(0 0 0 / 8%);

  .error-icon {
    font-size: 28px;
    color: #ff4d4f;
  }

  .ant-alert-message {
    margin-bottom: 8px;
  }
`;

const ReportSection = styled(Space)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  padding: 1.5rem;
  background: var(--color-background-light);
  border: 1px solid rgb(0 0 0 / 6%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);

  .report-description {
    padding-left: 24px;
    font-size: 0.9rem;
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
  margin-top: 1rem;

  .back-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
      transform: translateX(-2px);
    }
  }

  .home-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      transform: translateY(-2px);
    }
  }

  button {
    height: 44px;
    padding: 0 24px;
    border-radius: 8px;
  }
`;

export default ErrorElement;
