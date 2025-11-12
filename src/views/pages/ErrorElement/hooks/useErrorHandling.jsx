import { WarningOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import { useState, useEffect, createElement } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '../../../../features/auth/userSlice';
import { fbRecordError } from '../../../../firebase/errors/fbRecordError';
import ROUTES_NAME from '../../../../routes/routesName';
import { MESSAGES } from '../constants';

export const useErrorHandling = (errorInfo, errorStackTrace) => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reportError, setReportError] = useState(false);
    const [canGoBack, setCanGoBack] = useState(false);
    const { HOME } = ROUTES_NAME.BASIC_TERM;

    useEffect(() => {
        setCanGoBack(window.history.length > 2);
    }, []);

    const handleReportChange = (e) => {
        setReportError(e.target.checked);
    };

    const handleBack = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (reportError) {
                await fbRecordError(user, errorInfo, errorStackTrace);
                notification.success({
                    message: MESSAGES.ERROR_REPORTED,
                    description: MESSAGES.ERROR_REPORTED_DESC,
                    icon: createElement(WarningOutlined, { style: { color: '#52c41a' } })
                });
            }
            window.location.href = HOME;
        } catch (error) {
            setLoading(false);
            console.error('Error al reportar:', error);
        }
    };

    const handleGoBack = () => {
        try {
            navigate(-1);
        } catch (error) {
            console.warn('Unable to go back:', error);
            notification.warning({
                message: MESSAGES.CANT_GO_BACK,
                description: MESSAGES.CANT_GO_BACK_DESC,
            });
            window.location.href = HOME;
        }
    };

    return {
        user,
        loading,
        reportError,
        canGoBack,
        handleBack,
        handleGoBack,
        handleReportChange,
    };
};
