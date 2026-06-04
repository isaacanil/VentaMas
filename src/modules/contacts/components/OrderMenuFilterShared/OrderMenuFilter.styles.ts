import styled from 'styled-components';

interface ContainerProps {
  $isOpen: boolean;
}

export const Container = styled.div<ContainerProps>`
  width: 100%;
  height: 100%;
  max-width: 300px;
  max-height: 350px;
  margin-left: 4px;
  overflow: hidden;
  position: absolute;
  top: 5.2em;
  z-index: 1;
  background-color: #fff;
  border: 1px solid rgb(0 0 0 / 15%);
  border-radius: 6px;
  box-shadow: 10px 10px 10px 2px rgb(0 0 0 / 15%);
  transform: none;
  transition: transform 400ms ease-in-out;

  ${({ $isOpen }) => {
    switch ($isOpen) {
      case true:
        return `
        transform: scaleX(1) translateX(0px) translateY(0px);
        `;

      case false:
        return `
        transform: scale(0) translateX(-400px) translateY(-100px);
        `;

      default:
        break;
    }
  }}
`;

export const Head = styled.div`
  background-color: var(--white);

  h3 {
    padding: 0.4em 1em;
    margin: 0;
  }
`;

export const Body = styled.div``;
