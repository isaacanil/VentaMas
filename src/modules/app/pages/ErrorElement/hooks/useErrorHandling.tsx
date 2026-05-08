import { notification } from 'antd';
import { useEffect, useRef, useState } from 'react';
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
  options: { autoReport?: boolean } = {},
) => {
  const { autoReport = true } = options;
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [canGoBack] = useState(() => window.history.length > 2);
  const reportedErrorKeyRef = useRef<string | null>(null);
  const { HOME } = ROUTES_NAME.BASIC_TERM;

  useEffect(() => {
    if (!autoReport) return;
    if (errorInfo == null && errorStackTrace == null) return;

    const errorKey = `${errorStackTrace ?? ''}\n${errorInfo ?? ''}`;
    if (reportedErrorKeyRef.current === errorKey) return;

    reportedErrorKeyRef.current = errorKey;
    void fbRecordError(user, errorStackTrace, errorInfo);
  }, [autoReport, errorInfo, errorStackTrace, user]);

  const handleBack = () => {
    try {
      setLoading(true);
      window.location.href = HOME;
    } catch (error) {
      setLoading(false);
      console.error('Error al redirigir:', error);
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
    canGoBack,
    handleBack,
    handleGoBack,
  };
};
