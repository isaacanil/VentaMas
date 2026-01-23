import styled from 'styled-components';

import palette from '@/theme/colors/light/Palette';
import type { ContrastColorPair } from '@/theme/getContrastColorPairs';

export function Doc() {
  const colors = ['primary', 'error', 'warning', 'info', 'success'] as const;
  type BaseColor = (typeof colors)[number];

  const getTypes = (color: BaseColor): string[] => {
    return [
      `${color}`,
      `on-${color}`,
      `${color}-contained`,
      `on-${color}-contained`,
    ];
  };

  return (
    <Container>
      {colors.map((color, colorIndex) => {
        return (
          <div key={colorIndex}>
            {getTypes(color).map((type, typeIndex) => {
              return <ArrayList key={typeIndex} color={type} />;
            })}
          </div>
        );
      })}
    </Container>
  );
}

interface ArrayListProps {
  color?: string;
}

const ArrayList = ({ color = 'primary' }: ArrayListProps) => {
  if (!color) {
    return null;
  }
  if (!palette.colors[color]) {
    return null;
  }
  const scale = palette.colors[color] as ContrastColorPair;
  return (
    <ArrayListContainer>
      <Item color={scale['text']} bg={scale['bg']}>
        {scale.bg}
        <br />
      </Item>
    </ArrayListContainer>
  );
};
const ArrayListContainer = styled.div`
  display: grid;
`;
const Container = styled.div<{ color?: string }>`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  ${(props) => {
    const color = props.color;
    return `
      background-color: ${color};
    `;
  }}
`;
const Item = styled.div<{ color?: string; bg?: string }>`
  height: 8em;
  padding: 1em;
  ${(props) => {
    const color = props.color;
    const bg = props.bg;
    return `
      background-color: ${bg};
      color: ${color};

    `;
  }}
`;
