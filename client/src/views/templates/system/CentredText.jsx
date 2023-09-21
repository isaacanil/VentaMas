import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from './Button/Button';
import Typography from './Typografy/Typografy';

export const CenteredText = ({ textVariant = 'body1', containerVariant = 'text', text, buttonText, handleAction, showAfter = 0, ...props }) => {
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
        <Wrapper>
          <Content containerVariant={containerVariant}>
            <Typography variant={textVariant} align='center'>{text}</Typography>
            {(handleAction && buttonText) && (
              <Button
                title={buttonText}
                titlePosition={'center'}
                width='auto'
                bgcolor='primary'
                borderRadius={'normal'}
                onClick={handleAction}
                {...props}
              />
            )}
          </Content>
        </Wrapper>

      </Container>)
  );
};
const Container = styled.div`
  display: grid;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;

  position:absolute;
  top: 0;
  left: 0;
`;

const Text = styled.p`
  text-align: center;
  width: 100%;
  padding: 0 1em;
  max-width: 500px;
`;
const Wrapper = styled.div`
position: relative;
  display: grid;
  align-items: center;
  margin: 0;
  padding: 10px;
`;

const Content = styled.div`
height: 100%;
width: 100%;
max-width: 500px;
padding: 1em;
margin: 0;

display: grid;
  gap: 2em;
  justify-items: center;
  align-items: center;
  
  
  text-align: center;
  
  ${({ containerVariant }) => containerVariant === 'contained' && `
  border-radius: 10px;
  min-height: 200px;
  background-color: #ffffff;
  box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.75);
  `}


`