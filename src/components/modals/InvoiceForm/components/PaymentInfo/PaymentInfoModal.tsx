import { Modal } from 'antd';

import { PaymentInfo } from './PaymentInfo';

import type { PaymentInfoModalProps } from './types';

export const PaymentInfoModal = ({
  isOpen,
  handleClose,
  isEditLocked = false,
}: PaymentInfoModalProps) => (
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
