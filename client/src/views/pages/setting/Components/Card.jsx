import styled from "styled-components"
export const Card = ({data}) => {
    return (
        <Container>
            <Title>
                {data.title}
            </Title>
            <Description>
                {data.description}
            </Description>

        </Container>
    )
}

const Container = styled.div`
    background-color: #dbdbdb;
    padding: .8em;
    border-radius: 08px;

`
const Title = styled.h3`
   color: '#283t';
   margin: 0;
   margin-bottom: '0.3em';
    
`