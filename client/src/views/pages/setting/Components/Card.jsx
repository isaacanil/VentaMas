import styled from "styled-components"
import { Link } from "react-router-dom"
export const Card = ({data}) => {
    return (
        <Container to={data.path}>
            <Title>
                {data.title}
            </Title>
            <Description>
                {data.description}
            </Description>
        </Container>
    )
}

const Container = styled(Link)`
    background-color: var(--White1);
    padding: .8em;
    border-radius: 08px;

`
const Title = styled.h3`
   color: '#283t';
   margin: 0;
   margin-bottom: '0.3em';
    
`
const Description = styled.p`
    
`