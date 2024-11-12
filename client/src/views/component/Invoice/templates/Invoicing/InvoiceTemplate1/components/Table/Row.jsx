import styled from "styled-components"

export const Row = ({ cols, space, children }) => {
    return (
        <Container cols={cols} space={space}>
            {children}
        </Container>
    )
}
// Object to handle padding styles
const paddingStyles = {
    true: 'padding: 0.4em 0;',
    false: ''
};

// Object to handle column styles
const columnStyles = {
    '3': 'grid-template-columns: 1fr 0.8fr 0.8fr;',
    default: 'grid-template-columns: 1fr;'
};

const Container = styled.div`
   display: grid;
  align-items: center;
  gap: 0.4em;
  ${({ space }) => paddingStyles[space]}
  ${({ cols }) => columnStyles[cols] || columnStyles.default}
  `