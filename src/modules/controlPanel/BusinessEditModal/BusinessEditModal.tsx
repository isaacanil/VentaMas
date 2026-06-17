import { faStore } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button, Divider } from 'antd';
import React from 'react';
import { useDispatch } from 'react-redux';

import { toggleSignUpUser } from '@/features/modals/modalSlice';

import { ModalTitle, StoreIcon } from './BusinessEditModal.styles';
import type { BusinessEditModalProps } from './BusinessEditModal.types';
import { BusinessInfoSummary } from './components/BusinessInfoSummary/BusinessInfoSummary';
import { BusinessUserAccessSection } from './components/BusinessUserAccessSection/BusinessUserAccessSection';

export const BusinessEditModal: React.FC<BusinessEditModalProps> = ({
  isOpen,
  onClose,
  business,
}) => {
  const dispatch = useDispatch();

  const handleOpenSignUpModal = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(
      toggleSignUpUser({
        isOpen: true,
        businessID: business?.id,
      }),
    );
  };
  const handleCancel = (
    e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) => {
    if (e) {
      e.stopPropagation();
    }
    onClose();
  };

  return (
    <Modal
      title={
        <ModalTitle>
          <StoreIcon icon={faStore} />
          <span>Editar Negocio: {business?.name}</span>
        </ModalTitle>
      }
      open={isOpen}
      onCancel={handleCancel}
      mask={{ closable: true }}
      keyboard={true}
      width={600}
      footer={[
        <Button key="close" onClick={handleCancel}>
          Cerrar
        </Button>,
      ]}
    >
      <BusinessInfoSummary business={business} />

      <Divider />

      <BusinessUserAccessSection onAddUser={handleOpenSignUpModal} />
    </Modal>
  );
};
