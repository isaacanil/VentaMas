import { message } from 'antd';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useId, useRef, useState } from 'react';

import { icons } from '@/constants/icons/icons';
import { useDialog } from '@/Context/Dialog/useDialog';
import type { DialogSize, DialogType } from '@/Context/Dialog/contextState';
import { ButtonGroup } from '@/components/ui/Button/Button';
import Typography from '@/components/ui/Typografy/Typografy';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';

import { iconTypes } from './Dialog.config';
import {
  Backdrop,
  Body,
  CancelButton,
  CloseButton,
  ConfirmButton,
  Container,
  Description,
  Footer,
  Header,
  IconWrapper,
  LoadingSpinner,
  MessageText,
} from './Dialog.styles';
import { BackdropVariants, ContainerVariants } from './variants';

const Dialog = () => {
  const { dialog, onClose } = useDialog();
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const {
    isOpen,
    title,
    type = 'info',
    message: dialogMessage,
    onConfirm,
    onCancel,
    size = 'default',
    successMessage,
    cancelButtonText,
    confirmButtonText,
  } = dialog;

  const handleCancel = useCallback(() => {
    if (!isLoading) {
      onCancel?.();
      onClose();
    }
  }, [isLoading, onCancel, onClose]);

  useModalFocusTrap({
    open: isOpen,
    containerRef,
    onEscape: handleCancel,
  });

  if (!isOpen) return null;

  const finishConfirmFlow = () => {
    setIsLoading(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!onConfirm) return;

    setIsLoading(true);
    void Promise.resolve()
      .then(() => onConfirm())
      .then(() => {
        if (successMessage) {
          message.success(successMessage);
        }
      })
      .then(finishConfirmFlow, (error) => {
        finishConfirmFlow();
        throw error;
      });
  };

  const cancelText =
    cancelButtonText || (onConfirm === null ? 'Aceptar' : 'Cancelar');
  const confirmText = confirmButtonText || 'Confirmar';
  const typedType = type as DialogType;

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop
          variants={BackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <Container
            ref={containerRef}
            variants={ContainerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            $size={size as DialogSize}
            $type={typedType}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
          >
            <Header $type={typedType}>
              <Typography id={titleId} variant="h2" disableMargins>
                {title}
              </Typography>
              <CloseButton
                type="button"
                onClick={onClose}
                $type={typedType}
                disabled={isLoading}
                aria-label="Cerrar dialogo"
              >
                {icons.operationModes.close}
              </CloseButton>
            </Header>
            <Body>
              <Description $type={typedType}>
                <IconWrapper $type={typedType}>
                  {iconTypes[typedType]}
                </IconWrapper>
                <MessageText
                  id={descriptionId}
                  variant="p"
                  color="inherit"
                  disableMargins
                >
                  {dialogMessage}
                </MessageText>
              </Description>
            </Body>
            <Footer>
              <ButtonGroup>
                <CancelButton
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  {cancelText}
                </CancelButton>
                {onConfirm !== null && (
                  <ConfirmButton
                    type="button"
                    onClick={handleConfirm}
                    $type={typedType}
                    disabled={isLoading}
                  >
                    {confirmText}
                    {isLoading && <LoadingSpinner />}
                  </ConfirmButton>
                )}
              </ButtonGroup>
            </Footer>
          </Container>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};

export default Dialog;
