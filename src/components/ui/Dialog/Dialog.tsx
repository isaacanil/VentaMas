import { message } from 'antd';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { icons } from '@/constants/icons/icons';
import { useDialog } from '@/Context/Dialog/useDialog';
import type { DialogSize, DialogType } from '@/Context/Dialog/contextState';
import { ButtonGroup } from '@/components/ui/Button/Button';
import Typography from '@/components/ui/Typografy/Typografy';

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
  if (!dialog.isOpen) return null;

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

  const handleCancel = () => {
    if (!isLoading) {
      onCancel?.();
      onClose();
    }
  };

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
            variants={ContainerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            $size={size as DialogSize}
            $type={typedType}
          >
            <Header $type={typedType}>
              <Typography variant="h2" disableMargins>
                {title}
              </Typography>
              <CloseButton
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
                <MessageText variant="p" color="inherit" disableMargins>
                  {dialogMessage}
                </MessageText>
              </Description>
            </Body>
            <Footer>
              <ButtonGroup>
                <CancelButton onClick={handleCancel} disabled={isLoading}>
                  {cancelText}
                </CancelButton>
                {onConfirm !== null && (
                  <ConfirmButton
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
