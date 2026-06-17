import { useState, useCallback } from 'react';

import type { UserIdentity } from '@/types/users';
import { CORE_PRIVILEGED_ROLES } from '@/utils/roles/roleGroups';

interface UseAuthorizationPinOptions {
  onAuthorized?: (authorizer: UserIdentity) => void | Promise<void>;
  module?: string;
  allowedRoles?: string[];
  description?: string;
  reasonList?: string[];
  allowPasswordFallback?: boolean;
}

interface UseAuthorizationPinResult {
  showModal: () => void;
  hideModal: () => void;
  isModalOpen: boolean;
  modalProps: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onAuthorized: (authorizer: UserIdentity) => Promise<void>;
    description: string;
    allowedRoles: string[];
    reasonList: string[];
    module: string;
    allowPasswordFallback: boolean;
  };
}

/**
 * Hook para gestionar el flujo de autorización con PIN
 */
export const useAuthorizationPin = ({
  onAuthorized,
  module = 'invoices',
  allowedRoles = [...CORE_PRIVILEGED_ROLES],
  description = 'Se requiere autorización para continuar.',
  reasonList = [],
  allowPasswordFallback = true,
}: UseAuthorizationPinOptions = {}): UseAuthorizationPinResult => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleAuthorized = useCallback(
    async (authorizer: UserIdentity) => {
      if (onAuthorized) {
        await onAuthorized(authorizer);
      }
      hideModal();
    },
    [onAuthorized, hideModal],
  );

  const modalProps = {
    isOpen: isModalOpen,
    setIsOpen: setIsModalOpen,
    onAuthorized: handleAuthorized,
    description,
    allowedRoles,
    reasonList,
    module,
    allowPasswordFallback,
  };

  return {
    showModal,
    hideModal,
    isModalOpen,
    modalProps,
  };
};

export default useAuthorizationPin;
