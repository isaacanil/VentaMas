import styled from 'styled-components';
import { Button } from '../../templates/system/Button/Button';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const Text = styled.p`
  text-align: center;
`;

export const CenteredText = ({ text, buttonText }) => {
  return (
    <Container>
      <Text>{text}</Text>
 
    </Container>
  );
};


