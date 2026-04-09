import {
  faExclamationCircle,
  faCheckCircle,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { m, type HTMLMotionProps, type Variants } from 'framer-motion';
import React, { useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import {
  removeNotification,
  selectCurrentNotification,
} from '@/features/notification/notificationSlice';
import { Button } from '@/components/ui/Button/Button';

type NotificationVariant = 'success' | 'error' | 'warning' | 'info';

type NotificationStyleProps = {
  type?: NotificationVariant;
};

const getTimerByType = (type?: NotificationVariant) => {
  switch (type) {
    case 'success':
      return 4000;
    case 'error':
      return 10000;
    case 'warning':
      return 7000;
    default:
      return 5000;
  }
};

export const Notification = () => {
  const currentNotification = useSelector(selectCurrentNotification);
  const { title, message, type, visible } = currentNotification;

  const dispatch = useDispatch();
  const resolvedType: NotificationVariant | undefined =
    type === 'success' ||
    type === 'error' ||
    type === 'warning' ||
    type === 'info'
      ? type
      : undefined;

  const handleClose = useCallback(() => {
    dispatch(removeNotification());
  }, [dispatch]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        handleClose();
      }, getTimerByType(resolvedType));
      return () => clearTimeout(timer);
    }
  }, [visible, resolvedType, handleClose]);

  const icon = useMemo(() => {
    if (!resolvedType) return null;
    switch (resolvedType) {
      case 'error':
        return <FontAwesomeIcon icon={faExclamationCircle} />;
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} />;
      case 'info':
        return <FontAwesomeIcon icon={faInfoCircle} />;
      case 'warning':
        return <FontAwesomeIcon icon={faExclamationCircle} />;
      default:
        return null;
    }
  }, [resolvedType]);

  const notificationVariants: Variants = {
    hidden: {
      y: -100,
      opacity: 0,
      transition: {
        y: {
          duration: 0.1,
          ease: 'easeInOut',
        },
        opacity: {
          delay: 0.8,
          duration: 0.5, // Tiempo que desees para la opacidad
          ease: 'easeInOut',
        },
      },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <Container
      type={resolvedType}
      variants={notificationVariants}
      initial="hidden"
      animate={visible ? 'visible' : 'hidden'}
      exit="hidden"
    >
      {icon ? <Icon type={resolvedType}>{icon}</Icon> : null}
      <Body>
        {title ? <Title>{title}</Title> : <Title>{type}</Title>}
        {message ? <Message>{message}</Message> : null}
      </Body>
      <Button
        borderRadius={'light'}
        width={'icon24'}
        startIcon={icons.operationModes.close}
        onClick={handleClose}
      />
    </Container>
  );
};
type NotificationContainerProps = NotificationStyleProps &
  HTMLMotionProps<'div'>;

const Container = styled(m.div)<NotificationContainerProps>`
  max-width: 24em;
  width: 100%;
  min-height: 4em;
  height: auto;
  color: #fff;
  padding: 0.8em 0.4em 0.8em 1em;
  border-radius: 4px;
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  background-color: var(--white);
  backdrop-filter: blur(20px);
  align-items: center;

  svg {
    width: 1.4em;
    height: 1.4em;
  }

  gap: 1em;
  position: fixed;
  top: 2px;
  margin: 0 auto;
  left: 0;
  right: 0;
  z-index: 1000000000;
  transform: translateY(-100px);
  transition: transform 1s ease-in-out;

  @media (width <= 600px) {
    width: 96%;
  }

  ${(props: NotificationStyleProps) => {
    switch (props.type) {
      case 'error':
        return `
                color: #5c5c5c;
                svg{
                    fill: #f18f8f;
                }
                `;
      case 'success':
        return `
                color: #4e4e4e;
                svg{
                    fill: #8cd88c;
                }
                `;
      case 'info':
        return `
                color: #4e4e4e;
                svg{
                    fill: #8cbcd8;
                }
                `;
      case 'warning':
        return `
                color: #4e4e4e;
                svg{
                    fill: #e29843;
                }
                `;
      default:
        return `
                color: #4e4e4e;
                svg{
                    fill: #8cd88c;
                }
                `;
    }
  }};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 14px;
  text-transform: capitalize;
`;
const Body = styled.div`
  display: grid;
  gap: 0.4em;
  align-items: center;
`;
const Icon = styled.div<NotificationStyleProps>`
  width: 2.8em;

  /*
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius); */
  height: 100%;
  display: flex;
  align-items: center;

  svg {
    font-size: 1.4em;
    fill: white;
  }

  ${(props: NotificationStyleProps) => {
    switch (props.type) {
      case 'error':
        return `  
                svg{

                    fill: #f18f8f;
                }             
                `;
      case 'success':
        return `
                svg{
                    fill: #8cd88c;
                } 
           
                `;
      case 'info':
        return `
                svg{
                    fill: #8cbcd8;
                }
                background-color: #8cbcd8;
                `;
      case 'warning':
        return `
                svg{
                    fill: #FFCC00;
                }
              
                `;
      default:
        return `

                color: #4e4e4e;
              
                `;
    }
  }};
`;
const Message = styled.p`
  font-size: 14px;
  line-height: 16px;
`;
