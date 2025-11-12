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
  width: 100vw;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Button = styled.button`
  padding: 1em;
  height: 2em;
`;
