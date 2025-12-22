import { Button } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_NAME from '@/router/routes/routesName';
import { ButtonGroup } from '../../../templates/system/Button/ButtonGroup';
import WelcomeData from '../WelcomeData.json';

const Header = () => {
  const { LOGIN } = ROUTES_NAME.AUTH_TERM;
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <Head
      as={motion.div}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <Group>
        <WebName>{WelcomeData.webName}</WebName>
      </Group>
      <Group>
        <ButtonGroup>
          <Button
            type="primary"
            size="large"
            onClick={() => handleNavigate(LOGIN)}
          >
            Iniciar sesión
          </Button>
          {/* <Button
                        size="large"
                        onClick={() => handleNavigate(SIGNUP)}
                    >
                        Registrarse
                    </Button> */}
        </ButtonGroup>
      </Group>{' '}
    </Head>
  );
};

export default Header;

const Head = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.2em;
  padding: 0 1em;
  font-size: 25px;
  background: linear-gradient(135deg, var(--color, #1890ff) 0%, #40a9ff 100%);
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);

  @media (width <= 768px) {
    height: 60px;
    padding: 0 1em;
    font-size: 20px;
  }
`;

const Group = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  color: white;
`;

const WebName = styled.div`
  margin: 0;
  font-size: 1.1em;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgb(0 0 0 / 10%);

  @media (width <= 768px) {
    font-size: 1.2em;
  }

  @media (width <= 480px) {
    font-size: 1em;
  }
`;
