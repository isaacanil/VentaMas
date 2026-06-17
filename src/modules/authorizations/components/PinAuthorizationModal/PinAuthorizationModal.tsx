import { Button, Modal } from 'antd';

import { CORE_PRIVILEGED_ROLES } from '@/utils/roles/roleGroups';

import { PinAuthorizationContent } from './components/PinAuthorizationContent';
import { usePinAuthorizationController } from './hooks/usePinAuthorizationController';
import type { PinAuthorizationModalProps } from './types';

const DEFAULT_ALLOWED_ROLES = [...CORE_PRIVILEGED_ROLES];
const EMPTY_REASON_LIST: string[] = [];

export const PinAuthorizationModal = ({
  isOpen,
  setIsOpen,
  onAuthorized,
  description = 'Se requiere autorizacion para continuar.',
  allowedRoles = DEFAULT_ALLOWED_ROLES,
  reasonList = EMPTY_REASON_LIST,
  module = 'invoices',
  allowPasswordFallback = true,
}: PinAuthorizationModalProps) => {
  const {
    error,
    form,
    handleCancel,
    handleSubmit,
    loading,
    passwordInputRef,
    pinValue,
    setPinValue,
    toggleMode,
    usePassword,
    usernameInputRef,
  } = usePinAuthorizationController({
    allowPasswordFallback,
    allowedRoles,
    isOpen,
    module,
    onAuthorized,
    setIsOpen,
  });

  return (
    <Modal
      open={isOpen}
      onCancel={handleCancel}
      centered
      width={480}
      zIndex={99990}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={loading}
          onClick={() => void handleSubmit()}
        >
          Autorizar
        </Button>,
      ]}
    >
      <PinAuthorizationContent
        allowPasswordFallback={allowPasswordFallback}
        description={description}
        error={error}
        form={form}
        handleSubmit={handleSubmit}
        loading={loading}
        passwordInputRef={passwordInputRef}
        pinValue={pinValue}
        reasonList={reasonList}
        setPinValue={setPinValue}
        toggleMode={toggleMode}
        usePassword={usePassword}
        usernameInputRef={usernameInputRef}
      />
    </Modal>
  );
};

export default PinAuthorizationModal;
