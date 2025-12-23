import styled from 'styled-components';

import palette from '@/theme/colors/light/Palette';

export function Doc() {
  const colors = ['primary', 'error', 'warning', 'info', 'success'];
  const getTypes = (color) => {
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
const ArrayList = ({ color = 'primary' }) => {
  if (!color) {
    return null;
  }
  if (!palette.colors[color]) {
    return null;
  }
  const scale = palette.colors[color] || [];
  const _type = [
    `${color}`,
    `on ${color}`,
    `container ${color}`,
    `on container ${color}`,
  ];
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
const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  ${(props) => {
    const color = props.color;
    return `
      background-color: ${color};
    `;
  }}
`;
const Item = styled.div`
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
