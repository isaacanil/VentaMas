import React, { useId, useRef } from 'react';
import styled from 'styled-components';

import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';

type ModalProps = {
  content: React.ReactNode;
  closeModal: () => void;
};

const Modal = ({ content, closeModal }: ModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useModalFocusTrap({
    open: true,
    containerRef,
    onEscape: closeModal,
  });

  return (
    <ModalContainer>
      <ModalContent
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <ModalHeader>
          <h2 id={titleId}>Detalle</h2>
          <button type="button" onClick={closeModal}>
            Cerrar
          </button>
        </ModalHeader>
        {content}
      </ModalContent>
    </ModalContainer>
  );
};

export default Modal;

const ModalContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  width: 100%;
  height: 100%;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 20%);

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: -2px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
`;
