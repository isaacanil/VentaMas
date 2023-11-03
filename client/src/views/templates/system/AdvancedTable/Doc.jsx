
import styled from 'styled-components';
import palette from '../../../../theme/colors/light/Palette';

export function Doc() {

  const colors = ["primary", "error", "warning", "info", "success"];
  const getTypes = (color) => {
    return [
      `${color}`,
      `on-${color}`,
      `${color}-contained`,
      `on-${color}-contained`
    ]
  }

  return (
    <Container>
      {
        colors.map((color, index) => {
          return (
            <div>
              {getTypes(color).map((type, index) => {
                return (
                  <ArrayList key={index} color={type} />
                )
              })}
            </div>
          )
        })
      }
    </Container >
  );
}
const ArrayList = ({ color = "primary" }) => {
  if (!color) { return }
  if (!palette.colors[color]) { return }
  const scale = palette.colors[color] || [];
  const type = [
    `${color}`,
    `on ${color}`,
    `container ${color}`,
    `on container ${color}`
  ]
  return (
    <ArrayListContainer >
      <Item color={scale["text"]} bg={scale["bg"]}>
        {scale.bg}
        <br />
      </Item>
    </ArrayListContainer>
  )
}
const ArrayListContainer = styled.div`
  display: grid;


`
const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  ${props => {
    const color = props.color;
    return `
      background-color: ${color};
    `;
  }}
`;
const Item = styled.div`
 height: 8em;
  padding: 1em;
  ${props => {
    const color = props.color;
    const bg = props.bg;
    return `
      background-color: ${bg};
      color: ${color};

    `;
  }}
`

