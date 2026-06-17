import { m, type Variants } from 'framer-motion';
import React, { useCallback, useId, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  closeUserNotification,
  selectCurrentUserNotification,
} from '@/features/UserNotification/UserNotificationSlice';
import { useIsOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { FormattedValue } from '@/components/ui/FormattedValue';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';

import { HandleConfirmationAction } from './HandleConfirmationAction';

type ConfirmationDialogProps = {
  isOpen?: boolean;
  title?: string;
  description?: string;
  onConfirm?: string | (() => void) | null;
};

type UserNotificationState = {
  isOpen: boolean;
  title?: string | null;
  description?: string | null;
  onConfirm?: string | (() => void) | null;
};

export const ConfirmationDialog = ({
  isOpen: isOpenProp,
  title: titleProp,
  description: descriptionProp,
  onConfirm: onConfirmProp,
}: ConfirmationDialogProps) => {
  const confirmation = useSelector(
    selectCurrentUserNotification,
  ) as UserNotificationState;
  const isOpen = isOpenProp ?? confirmation.isOpen;
  const title = titleProp ?? confirmation.title ?? '';
  const description = descriptionProp ?? confirmation.description ?? '';
  const onConfirm = onConfirmProp ?? confirmation.onConfirm ?? null;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const { status } = useIsOpenCashReconciliation();
  const isExistingOpenCR = status === 'open' || status === 'closing';

  const resource = { isExistingOpenCR };

  const handleConfirm = () =>
    HandleConfirmationAction(onConfirm, navigate, dispatch, resource);

  const handleCloseConfirmation = useCallback(
    () => dispatch(closeUserNotification()),
    [dispatch],
  );

  useModalFocusTrap({
    open: isOpen,
    containerRef,
    onEscape: handleCloseConfirmation,
  });

  const BackdropVariants: Variants = {
    hidden: {
      opacity: 0,
      pointerEvents: 'none',
    },
    visible: {
      opacity: 1,
      pointerEvents: 'auto',
    },
  };
  const ContainerVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };
  const handleCancelBtnName = () => {
    switch (onConfirm) {
      case null:
        return 'Aceptar';
      default:
        return 'Cancelar';
    }
  };

  return (
    isOpen && (
      <Backdrop
        variants={BackdropVariants}
        initial={'hidden'}
        animate={isOpen ? 'visible' : 'hidden'}
      >
        <Container
          ref={containerRef}
          variants={ContainerVariants}
          initial={'hidden'}
          animate={isOpen ? 'visible' : 'hidden'}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
        >
          <Header id={titleId}>
            <FormattedValue type={'title'} value={title} />
          </Header>
          <Body id={descriptionId}>
            <FormattedValue type={'paragraph'} value={description} />
          </Body>
          <Footer>
            <Group>
              <ButtonGroup>
                {
                  <Button
                    title={handleCancelBtnName()}
                    onClick={handleCloseConfirmation}
                    bgcolor={'gray'}
                  />
                }
                {onConfirm !== null && (
                  <Button
                    title={'Confirmar'}
                    onClick={handleConfirm}
                    bgcolor={'primary'}
                  />
                )}
              </ButtonGroup>
            </Group>
          </Footer>
        </Container>
      </Backdrop>
    )
  );
};
const Backdrop = styled(m.div)`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100dvw;
  height: 100dvh;
  backdrop-filter: blur(5px) brightness(0.5) saturate(100%) contrast(100%);
`;
const Container = styled(m.div)`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: 1em;
  width: 100%;
  max-width: 600px;
  height: 300px;
  padding: 0.4em;
  background-color: white;
  border-radius: var(--border-radius);
`;
const Header = styled.div`
  padding: 1em;
`;
const Body = styled.div`
  padding: 0 1em;
`;

const Footer = styled.div``;
const Group = styled.div`
  display: flex;
  justify-content: flex-end;
`;
