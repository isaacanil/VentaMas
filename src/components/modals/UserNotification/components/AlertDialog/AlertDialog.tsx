import { m, type Variants } from 'framer-motion';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCurrentUserNotification } from '@/features/UserNotification/UserNotificationSlice';
import { Button, ButtonGroup } from '@/components/ui/Button/Button';
import { FormattedValue } from '@/components/ui/FormattedValue/FormattedValue';

type AlertDialogProps = {
  onSubmit?: () => void;
  submitBtnName?: string;
};

type UserNotificationState = {
  isOpen: boolean;
  title?: string | null;
  description?: string | null;
};

export const AlertDialog = ({ onSubmit, submitBtnName }: AlertDialogProps) => {
  const confirmation = useSelector(
    selectCurrentUserNotification,
  ) as UserNotificationState;
  const { isOpen, title, description } = confirmation;

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
                <Button
                  title={submitBtnName || 'Confirmar'}
                  onClick={onSubmit}
                  bgcolor={'primary'}
                />
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
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
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
