import styled from "styled-components"

export const Row = ({ cols, space, children }) => {
    return (
        <Container cols={cols} space={space}>
            {children}
        </Container>
    )
}
const Container = styled.div`
  display: grid;
 align-items: center;
  grid-template-columns: 1fr;
  ${props => {
        switch (props.space) {
            case true:
                return `
                padding: 0.4em 0;
                `
            default:
                break;
        }
    }
    }
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