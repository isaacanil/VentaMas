import styled from "styled-components"
import { FormattedValue } from "../../../../templates/system/FormattedValue/FormattedValue"

export const BusinessCard = ({business}) => {
    return (
        <Container>
            <Head>
                 <FormattedValue type={'subtitle'} value={business.name}>{business.name}</FormattedValue>
            </Head>
            <Body>
                <p>{business.description}</p>
                <p>{business.address}</p>
                <p>{business.tel}</p>
                <p>{business.email}</p>
                <p>{business.web}</p>
            </Body>
        </Container>
    )
}



const Container = styled.div`
    padding: 10px;
    border: var(--border-primary);
    border-radius: 10px;
    background-color: #ffffff;
  
`
const Head = styled.div`
    text-align: center;
    color: black;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;

`
const Body = styled.div`
    color: black;
    font-size: 15px;
`
