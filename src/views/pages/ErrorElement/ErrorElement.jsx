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
        reportError,
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
                            variants={ANIMATIONS.logo}
                            initial="hidden"
                            animate="visible"
                        >
                            <Logo />
                        </LogoWrapper>

                        <StyledAlert
                            icon={<BugOutlined className="error-icon" />}
                            message={
                                <AntTitle level={4} style={{ margin: 0 }}>
                                    {MESSAGES.ERROR_TITLE}
                                </AntTitle>
                            }
                            description={
                                <Text>{MESSAGES.ERROR_DESCRIPTION}</Text>
                            }
                            type="error"
                            showIcon
                        />

                        <ReportSection>
                            <Checkbox onChange={handleReportChange}>
                                <Text strong>{MESSAGES.REPORT_ERROR}</Text>
                            </Checkbox>
                            <Text type="secondary" className="report-description">
                                {MESSAGES.REPORT_DESCRIPTION}
                            </Text>
                        </ReportSection>

                        <ButtonGroup>
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
                        <br />
                        {user?.role === 'dev' && (
                            <ErrorDetails
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
    height: 100vh;
    display: flex;
    justify-content: center;
   overflow-y: auto;
`;

const LogoWrapper = styled(motion.div)`
    display: flex;
    justify-content: center;
    margin-bottom: 2.5rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
`;

const StyledAlert = styled(Alert)`
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 0, 0, 0.1);
    margin: 1em 0;
    
    .error-icon {
        font-size: 28px;
        color: #ff4d4f;
    }

    .ant-alert-message {
        margin-bottom: 8px;
    }
`;

const ReportSection = styled(Space)`
    padding: 1.5rem;
    background: var(--color-background-light);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    
    .report-description {
        font-size: 0.9rem;
        opacity: 0.85;
        padding-left: 24px;
    }

    .ant-checkbox-wrapper:hover {
        opacity: 0.8;
    }
`;

const ButtonGroup = styled(Space)`
    width: 100%;
    justify-content: center;
    gap: 16px !important;
    margin-top: 1rem;
    
    .back-button {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        &:hover {
            transform: translateX(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
    }
    
    .home-button {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
    }

    button {
        height: 44px;
        padding: 0 24px;
        border-radius: 8px;
    }
`;

export default ErrorElement;