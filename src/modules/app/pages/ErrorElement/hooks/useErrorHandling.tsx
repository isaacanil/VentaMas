import { WarningOutlined } from '@/constants/icons/antd';
import { notification } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { useState, createElement } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice';
import { fbRecordError } from '@/firebase/errors/fbRecordError';
import ROUTES_NAME from '@/router/routes/routesName';
import { MESSAGES } from '@/modules/app/pages/ErrorElement/constants';

type ErrorMessage = string | null | undefined;

export const useErrorHandling = (
  errorInfo: ErrorMessage,
  errorStackTrace: ErrorMessage,
) => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [canGoBack] = useState(() => window.history.length > 2);
  const { HOME } = ROUTES_NAME.BASIC_TERM;

  const handleReportChange = (e: CheckboxChangeEvent) => {
    setReportError(e.target.checked);
  };

  const handleBack = async (event?: React.MouseEvent<HTMLElement>) => {
    event?.preventDefault();
    try {
      setLoading(true);
      if (reportError) {
        await fbRecordError(user, errorInfo, errorStackTrace);
        notification.success({
          message: MESSAGES.ERROR_REPORTED,
          description: MESSAGES.ERROR_REPORTED_DESC,
          icon: createElement(WarningOutlined, { style: { color: '#52c41a' } }),
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
