import styled from "styled-components"

export const BusinessCard = ({business}) => {
    return (
        <Container>
            <Head>

                 <h1>{business.name}</h1>
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
    border: 1px solid black;
    border-radius: 10px;
    background-color: #cfe2e6;
  
`
const Head = styled.div`
    text-align: center;
    color: white;
    font-size: 20px;
    font-weight: bold;
`
const Body = styled.div`
    color: white;
    font-size: 15px;
    font-weight: bold;
`
