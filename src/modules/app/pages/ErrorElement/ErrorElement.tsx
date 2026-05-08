import { HomeOutlined, RollbackOutlined } from '@/constants/icons/antd';
import { Alert, Button } from '@heroui/react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

import { Logo } from '@/assets/logo/Logo';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';

import { ErrorCard } from './components/ErrorCard';
import { ErrorDetails } from './components/ErrorDetails';
import { MESSAGES, ANIMATIONS } from './constants';
import { useErrorHandling } from './hooks/useErrorHandling';

interface ErrorElementProps {
  errorInfo?: string | null;
  errorStackTrace?: string | null;
  autoReport?: boolean;
}

export const ErrorElement = ({
  autoReport = true,
  errorInfo,
  errorStackTrace,
}: ErrorElementProps) => {
  const { user, loading, canGoBack, handleBack, handleGoBack } =
    useErrorHandling(errorInfo, errorStackTrace, { autoReport });

  return (
    <Container
      variants={ANIMATIONS.container}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <ErrorCard>
        <ContentStack>
          <LogoWrapper
            variants={ANIMATIONS.logo}
            initial="hidden"
            animate="visible"
          >
            <Logo />
          </LogoWrapper>

          <StyledAlert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{MESSAGES.ERROR_TITLE}</Alert.Title>
              <Alert.Description>
                {MESSAGES.ERROR_DESCRIPTION}
              </Alert.Description>
            </Alert.Content>
          </StyledAlert>

          <ButtonGroup>
            {canGoBack && (
              <Button variant="secondary" size="lg" onPress={handleGoBack}>
                <RollbackOutlined />
                {MESSAGES.GO_BACK}
              </Button>
            )}
            <Button
              variant="primary"
              size="lg"
              onPress={handleBack}
              isPending={loading}
            >
              <HomeOutlined />
              {MESSAGES.GO_HOME}
            </Button>
          </ButtonGroup>
          {hasDeveloperAccess(user) && (
            <ErrorDetails
              errorStackTrace={errorStackTrace}
              variants={ANIMATIONS.errorDetails}
            />
          )}
        </ContentStack>
      </ErrorCard>
    </Container>
  );
};

ErrorElement.propTypes = {
  autoReport: PropTypes.bool,
  errorInfo: PropTypes.string,
  errorStackTrace: PropTypes.string,
};

const Container = styled(m.main)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: var(--ds-color-bg-page, #f8f9fa);
  padding: clamp(20px, 5vw, 48px);
  overflow-y: auto;
`;

const ContentStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5, 20px);
  width: 100%;
`;

const LogoWrapper = styled(m.div)`
  display: flex;
  justify-content: center;
  margin-bottom: var(--ds-space-2, 8px);
  filter: drop-shadow(0 4px 8px rgb(0 0 0 / 8%));
`;

const StyledAlert = styled(Alert)`
  width: 100%;
  border: 1px solid var(--ds-color-state-danger-border, #fecaca);
  background: var(--ds-color-state-danger-subtle, #fef2f2);

  .alert__title {
    font-size: var(--ds-font-size-md, 1rem);
    font-weight: var(--ds-font-weight-semibold, 600);
  }

  .alert__description {
    color: var(--ds-color-text-secondary, #52525b);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--ds-space-3, 12px);
  justify-content: center;
  width: 100%;
  flex-wrap: wrap;

  button {
    min-width: 160px;
  }
`;

export default ErrorElement;
