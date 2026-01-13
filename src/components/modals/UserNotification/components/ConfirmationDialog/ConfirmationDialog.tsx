import { motion } from 'framer-motion';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  closeUserNotification,
  selectCurrentUserNotification,
} from '@/features/UserNotification/UserNotificationSlice';
import { useIsOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import {
  Button,
  ButtonGroup,
} from '@/components/ui/Button/Button';
import { FormattedValue } from '@/components/ui/FormattedValue/FormattedValue';

import { HandleConfirmationAction } from './HandleConfirmationAction';

type ConfirmationDialogProps = {
  isOpen?: boolean;
  title?: string;
  description?: string;
  onConfirm?: string | null;
};

type UserNotificationState = {
  isOpen: boolean;
  title?: string | null;
  description?: string | null;
  onConfirm?: string | null;
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

  const { status } = useIsOpenCashReconciliation();
  const isExistingOpenCR = status === 'open' || status === 'closing';

  const resource = { isExistingOpenCR };

  const handleConfirm = () =>
    HandleConfirmationAction(onConfirm, navigate, dispatch, resource);

  const handleCloseConfirmation = () => dispatch(closeUserNotification());

  const BackdropVariants = {
    hidden: {
      opacity: 0,
      pointerEvent: 'none',
    },
    visible: {
      opacity: 1,
      pointerEvent: 'auto',
    },
  };
  const ContainerVariants = {
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
          variants={ContainerVariants}
          initial={'hidden'}
          animate={isOpen ? 'visible' : 'hidden'}
        >
          <Header>
            <FormattedValue type={'title'} value={title} />
          </Header>
          <Body>
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
const Backdrop = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(5px) brightness(0.5) saturate(100%) contrast(100%);
`;
const Container = styled(motion.div)`
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
