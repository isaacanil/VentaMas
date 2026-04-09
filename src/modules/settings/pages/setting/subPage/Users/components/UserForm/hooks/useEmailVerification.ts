import { Form, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import type { FormInstance } from 'antd/es/form';

import {
  fbSendEmailVerification,
  fbVerifyEmailCode,
} from '@/firebase/Auth/fbAuthV2/fbEmailVerification';

import { normalizeEmailValue } from '../utils/email';

export type EmailVerifyState =
  | 'idle'
  | 'sending'
  | 'codeSent'
  | 'verifying'
  | 'verified';

type UseEmailVerificationArgs = {
  form: FormInstance;
  isEditMode: boolean;
  userId: string | null;
  initialEmail: unknown;
  initialEmailVerified: boolean;
};

export const useEmailVerification = ({
  form,
  isEditMode,
  userId,
  initialEmail,
  initialEmailVerified,
}: UseEmailVerificationArgs) => {
  const watchedEmail = Form.useWatch('email', form);
  const currentEmailNormalized = useMemo(
    () => normalizeEmailValue(watchedEmail),
    [watchedEmail],
  );
  const initialEmailNormalized = useMemo(
    () => normalizeEmailValue(initialEmail),
    [initialEmail],
  );

  const seedVerifiedEmail = initialEmailVerified ? initialEmailNormalized : null;

  const [emailVerifyState, setEmailVerifyState] =
    useState<EmailVerifyState>('idle');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(
    seedVerifiedEmail,
  );
  const [expiresAtMillis, setExpiresAtMillis] = useState<number | null>(null);
  const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] =
    useState(false);

  const isCurrentEmailVerified = useMemo(() => {
    if (!isEditMode) return false;
    if (!currentEmailNormalized) return false;
    return verifiedEmail === currentEmailNormalized;
  }, [currentEmailNormalized, isEditMode, verifiedEmail]);

  const emailChanged = useMemo(() => {
    if (!isEditMode) return false;
    return currentEmailNormalized !== initialEmailNormalized;
  }, [currentEmailNormalized, initialEmailNormalized, isEditMode]);

  const mustVerifyEmailToSubmit = useMemo(() => {
    if (!isEditMode) return false;
    // Only block when linking/changing an email (not for legacy unverified emails).
    if (!currentEmailNormalized) return false;
    return emailChanged && !isCurrentEmailVerified;
  }, [currentEmailNormalized, emailChanged, isCurrentEmailVerified, isEditMode]);

  const resetFlow = useCallback(() => {
    setEmailVerifyState('idle');
    setVerificationCode('');
    setExpiresAtMillis(null);
  }, []);

  const closeEmailVerificationModal = useCallback(() => {
    setIsEmailVerificationModalOpen(false);
    resetFlow();
  }, [resetFlow]);

  const openEmailVerificationModal = useCallback(() => {
    if (!isEditMode) return;
    setIsEmailVerificationModalOpen(true);
  }, [isEditMode]);

  const onEmailInputChanged = useCallback(() => {
    if (!isEditMode) return;
    if (isEmailVerificationModalOpen) setIsEmailVerificationModalOpen(false);
    if (emailVerifyState !== 'idle' || verificationCode.length) resetFlow();
  }, [
    emailVerifyState,
    isEditMode,
    isEmailVerificationModalOpen,
    resetFlow,
    verificationCode.length,
  ]);

  const sendVerification = useCallback(async () => {
    if (!isEditMode) return;
    if (!userId) {
      message.warning('Guarda el usuario primero.');
      return;
    }
    try {
      await form.validateFields(['email']);
    } catch {
      return;
    }

    const emailValue = form.getFieldValue('email');
    if (!emailValue) {
      message.warning('Ingresa un correo.');
      return;
    }

    setEmailVerifyState('sending');
    try {
      const res = await fbSendEmailVerification(userId, String(emailValue));
      setEmailVerifyState('codeSent');
      setExpiresAtMillis(
        typeof res?.expiresAtMillis === 'number'
          ? res.expiresAtMillis
          : Date.now() + 10 * 60 * 1000,
      );
      message.success('Código de verificación enviado al correo.');
    } catch (error) {
      setEmailVerifyState('idle');
      message.error(
        error instanceof Error ? error.message : 'Error enviando código.',
      );
    }
  }, [form, isEditMode, userId]);

  const verifyCode = useCallback(async () => {
    if (!isEditMode) return;
    if (!userId || !verificationCode.trim()) return;

    setEmailVerifyState('verifying');
    try {
      const result = await fbVerifyEmailCode(userId, verificationCode);
      setEmailVerifyState('verified');
      setVerifiedEmail(
        normalizeEmailValue(result?.email) || currentEmailNormalized,
      );
      message.success('Correo verificado exitosamente.');
      closeEmailVerificationModal();
    } catch (error) {
      setEmailVerifyState('codeSent');
      message.error(
        error instanceof Error ? error.message : 'Error verificando código.',
      );
    }
  }, [
    closeEmailVerificationModal,
    currentEmailNormalized,
    isEditMode,
    userId,
    verificationCode,
  ]);

  return {
    currentEmailNormalized,
    emailVerifyState,
    expiresAtMillis,
    isCurrentEmailVerified,
    isEmailVerificationModalOpen,
    mustVerifyEmailToSubmit,
    onEmailInputChanged,
    openEmailVerificationModal,
    closeEmailVerificationModal,
    sendVerification,
    verificationCode,
    setVerificationCode,
    setVerifiedEmail,
    verifyCode,
  };
};
