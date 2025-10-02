import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/userSlice';

/**
 * Hook para gestionar el flujo de autorización con PIN
 *
 * @param {Object} options
 * @param {Function} options.onAuthorized - Callback cuando la autorización es exitosa
 * @param {string} options.module - Módulo a autorizar ('invoices', 'accountsReceivable', etc.)
 * @param {Array<string>} options.allowedRoles - Roles permitidos para autorizar
 * @param {string} options.description - Descripción de la autorización
 * @param {Array<string>} options.reasonList - Lista de razones para la autorización
 *
 * @returns {Object} - { showModal, hideModal, isModalOpen, modalProps }
 */
export const useAuthorizationPin = ({
  onAuthorized,
  module = 'invoices',
  allowedRoles = ['admin', 'owner', 'dev'],
  description = 'Se requiere autorización para continuar.',
  reasonList = [],
  allowPasswordFallback = true,
} = {}) => {
  const user = useSelector(selectUser);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleAuthorized = useCallback((authorizer) => {
    if (onAuthorized) {
      onAuthorized(authorizer);
    }
    hideModal();
  }, [onAuthorized, hideModal]);

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
