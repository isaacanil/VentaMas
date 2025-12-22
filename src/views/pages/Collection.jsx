import styled from 'styled-components';

export const Collection = () => {
  const handleClick = () => {
    // Handle click logic here
  };
  return (
    <Container>
      <Button onClick={handleClick}>Click</Button>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100%;
`;
const Button = styled.button`
  height: 2em;
  padding: 1em;
`;
