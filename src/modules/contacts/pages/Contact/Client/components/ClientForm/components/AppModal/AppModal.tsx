import { AnimatePresence, m } from 'framer-motion';
import { type ReactNode, useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';

export type AppModalProps = {
  open: boolean;
  title?: ReactNode;
  /** Pass React nodes for footer actions. */
  footer?: ReactNode;
  width?: number | string;
  onClose?: () => void;
  maskClosable?: boolean;
  keyboard?: boolean;
  /** Unmount children when modal is closed (equivalent to Ant's destroyOnHidden) */
  destroyOnClose?: boolean;
  children?: ReactNode;
};

export const AppModal = ({
  open,
  title,
  footer,
  width = 700,
  onClose,
  maskClosable = true,
  keyboard = true,
  destroyOnClose = false,
  children,
}: AppModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const shouldRenderFooter = footer !== undefined && footer !== null;

  const handleEscape = useCallback(() => {
    if (keyboard) {
      onClose?.();
    }
  }, [keyboard, onClose]);

  useModalFocusTrap({
    open,
    containerRef: modalRef,
    onEscape: keyboard ? handleEscape : undefined,
  });

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (maskClosable && e.target === overlayRef.current) onClose?.();
  };

  const modalContent = (
    <AnimatePresence mode="wait">
      {open && (
        <Overlay
          ref={overlayRef}
          as={m.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          onClick={handleOverlayClick}
        >
          <ModalWrap
            ref={modalRef}
            $width={width}
            as={m.div}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Ventana modal'}
            tabIndex={-1}
            layout
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 14,
              scale: 0.98,
              transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 32,
              mass: 1,
              layout: {
                type: 'spring',
                stiffness: 210,
                damping: 30,
              },
            }}
          >
            <ModalHeader>
              <ModalTitle id={title ? titleId : undefined}>{title}</ModalTitle>
              <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
                x
              </CloseButton>
            </ModalHeader>

            <ModalBody>{destroyOnClose && !open ? null : children}</ModalBody>

            {shouldRenderFooter && <ModalFooter>{footer}</ModalFooter>}
          </ModalWrap>
        </Overlay>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

/* ─── Styled Components ─────────────────────────────────────── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0px 16px;
  overflow-y: auto;
`;

const ModalWrap = styled.div<{ $width: number | string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: ${({ $width }) =>
    typeof $width === 'number' ? `${$width}px` : $width};
  max-width: 100%;
  max-height: calc(100dvh - 20px);
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 6px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
  overflow: hidden;
  margin: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`;

const ModalTitle = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.5;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  padding: 4px 8px;
  border-radius: 4px;
  transition:
    color 0.2s,
    background 0.2s;
  line-height: 1;

  &:hover {
    color: rgba(0, 0, 0, 0.88);
    background: rgba(0, 0, 0, 0.06);
  }

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: 2px;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
`;

const ModalFooter = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  box-sizing: border-box;
`;
