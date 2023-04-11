import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from './Button/Button';

const Container = styled.div`
  display: grid;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  top: 0;
  left: 0;
  position:absolute;
`;

const Text = styled.p`
  text-align: center;
  width: 100%;
  padding: 0 1em;
  max-width: 500px;
`;

export const CenteredText = ({ text, buttonText, handleAction, showAfter = 0 }) => {
  const [show, setShow] = useState(false);
  const handleButton = (e) => {
    e.preventDefault();
    alert('hola')
  };
  useEffect(() => {
    if (showAfter || showAfter === 0) {
      setTimeout(() => {
        setShow(true)
      }, showAfter);
    };
  }, [])
  return (
    show && (
      <Container onContextMenu={handleButton}>
        <Content>

        <Text>{text}</Text>
        {buttonText && (
          <Button 
          title={buttonText} 
          titlePosition={'center'}
          width='auto'
          bgcolor='primary'
          borderRadius={'normal'}
          onClick={handleAction}
          />
        )}
        </Content>
      </Container>)
  );
};


const Content = styled.div`
  display: grid;
  gap: 2em;
  justify-content: center;
  justify-items: center;
  align-items: center;
  
  margin: 0;
  padding: 0;
`