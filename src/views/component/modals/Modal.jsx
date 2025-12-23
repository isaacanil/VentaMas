import { motion } from 'framer-motion';
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

import { icons } from '../../../constants/icons/icons';
import { Button } from '../../templates/system/Button/Button';
import { ButtonGroup } from '../../templates/system/Button/Button';
import { MotionWrapper } from '../base/animation/MotionWrapper';

export const Modal = ({
  children,
  nameRef,
  handleSubmit,
  close,
  btnSubmitName,
  isOpen,
  subModal,
  width,
}) => {
  const [modalContent, setModalContent] = useState(false);
  const timeoutRef = useRef(null);

  const done = async () => {
    await handleSubmit?.();
    close();
  };

  useEffect(() => {
    if (isOpen) {
      timeoutRef.current = window.setTimeout(() => {
        setModalContent(true);
      }, 300);
    }
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setModalContent(false);
    };
  }, [isOpen]);
  const backdropVariants = {
    open: {
      opacity: 1,
      pointerEvents: 'all',
    },
    closed: {
      opacity: 0,
      pointerEvents: 'none',
    },
  };
  const containerVariants = {
    open: { scale: 1 },
    closed: { scale: 0 },
  };
  return (
    <Backdrop
      variants={backdropVariants}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
      exit="closed"
      transition={{ duration: 0.3 }}
      isOpen={isOpen}
    >
      <Container
        variants={containerVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        exit="closed"
        width={width}
      >
        <Header>
          <Title>{nameRef}</Title>
          <Button
            title={icons.operationModes.close}
            width="icon24"
            borderRadius="normal"
            color="error"
            onClick={close}
          />
        </Header>
        <Body>
          {modalContent && <MotionWrapper>{children}</MotionWrapper>}
          {subModal ? subModal : null}
        </Body>
        <Footer>
          <ButtonGroup>
            <Button borderRadius="normal" title={'Cancel'} onClick={close} />
            <Button
              borderRadius="normal"
              title={btnSubmitName}
              onClick={done}
              color="primary"
            />
          </ButtonGroup>
        </Footer>
      </Container>
    </Backdrop>
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
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  background-color: var(--black-op);
  backdrop-filter: blur(var(--blur));
  transition: opacity 400ms ease-in-out;
`;
const Container = styled(motion.div)`
  width: 100vw;
  max-width: 720px;
  height: 98vh;
  max-height: 1000px;
  background-color: var(--white);
  display: grid;
  grid-template-rows: 3em auto 3em;
  border-radius: 6px;
  overflow: hidden;
  position: relative;

  @media (width <= 768px) {
    width: 100vw;
    max-width: 100vw;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  ${(props) => {
    switch (props.width) {
      case 'small':
        return `
            width: 100vw;
            max-width: 600px;
            `;
      case 'medium':
        return `
            width: 100vw;
            max-width: 800px;
            `;
      case 'large':
        return `
            width: 100vw;
            max-width: 1000px;
            `;
      case 'extra-large':
        return `
            width: 100vw;
            max-width: 1200px;
            `;
    }
  }}
`;
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1em;
  background-color: rgb(48 48 48);
`;
const Body = styled.div`
  display: grid;
  overflow: auto;
`;
const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 1em;
  border-top: 1px solid var(--gray);
`;
const Title = styled.div`
  font-weight: 600;
  color: rgb(255 255 255);
`;
