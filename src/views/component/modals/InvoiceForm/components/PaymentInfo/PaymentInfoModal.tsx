import { Modal } from 'antd';
import { FC } from 'react';

import { PaymentInfo } from './PaymentInfo';

import type { PaymentInfoModalProps } from './types';

export const PaymentInfoModal: FC<PaymentInfoModalProps> = ({
  isOpen,
  handleClose,
  isEditLocked = false,
}) => (
  <Modal
    open={isOpen}
    footer={null}
    onCancel={handleClose}
    closable={false}
    maskClosable={false}
    keyboard={false}
    destroyOnHidden
    style={{ top: '10px' }}
    title="Información de Pago"
    width={620}
  >
    <PaymentInfo isEditLocked={isEditLocked} onContinue={handleClose} />
  </Modal>
);
