import styled from "styled-components"

export const Row = ({ cols, children }) => {
    return (
        <Container cols={cols}>
            {children}
        </Container>
    )
}
const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr;
      ${props => {
        switch (props.cols) {
            case '3':
                return `
              grid-template-columns: 1fr 0.8fr 0.8fr;
              `
            default:
                break;
        }
    }}
  `