import styled from 'styled-components';

interface BodyProps {
  $isOpen: boolean;
  $index: number;
}

interface FilterOptionProps {
  $isSelected: boolean;
}

export const Container = styled.div``;

export const Body = styled.div<BodyProps>`
  display: grid;
  gap: 1em;
  height: auto;
  padding: 0.4em 1em;
  background-color: rgb(242 242 242);
  transition:
    height 2s ease-in-out,
    transform 2s ease-in-out;

  ${({ $isOpen, $index }) => {
    switch ($isOpen) {
      case true:
        return `
                transform: translate(0, 0px);
                background-color: rgb(242, 242, 242);
                padding: 0.4em 1em;
                position: relative;
                height: auto;
                z-index: 1;
                display: grid;
                gap: 1em;
                transition-property: transform, z-index;
                transition-duration: 400ms, 400ms;
                transition-delay: 0s, 400ms;
                transition-timing-function: easy-in-out;
                `;

      case false:
        return `
                transform: translate(0, -500px);
                position: absolute;
                height: 0px;
                z-index: ${-($index + 3)};
                width: 100%;
                transition-property: transform, z-index;
                transition-duration: 400ms, 400ms;
                transition-delay: 100ms, 0ms;
                transition-timing-function: easy-in-out, lineal;
        `;

      default:
        break;
    }
  }}
`;

export const Head = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 1em;
  align-items: center;
  height: 2em;
  padding: 0 1em;
  background-color: var(--white);
`;

export const Items = styled.ul`
  display: grid;
  gap: 0.4em;
  padding: 0;
  list-style: none;
`;

export const FilterOption = styled.li<FilterOptionProps>`
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 1em;
  padding: 0.2em 0.6em;
  position: relative;
  background-color: rgb(254 254 254);
  border-radius: 0.4em;

  ${({ $isSelected }) => {
    switch ($isSelected) {
      case true:
        return `
                    background-color: rgb(34, 106, 201);
                    `;
      case false:
        return `
                    background-color: rgb(254, 254, 254);
                    `;
      default:
        break;
    }
  }}
`;
