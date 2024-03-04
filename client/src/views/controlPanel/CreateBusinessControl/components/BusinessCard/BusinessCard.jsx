import styled from "styled-components"
import { FormattedValue } from "../../../../templates/system/FormattedValue/FormattedValue"
import { BusinessEditModal } from "../../../BusinessEditModal/BusinessEditModal"
import { useState } from "react"

export const BusinessCard = ({ business }) => {
    const [businessEditModalOpen, setBusinessEditModalOpen] = useState(false)
    const handleBusinessEdit = () => setBusinessEditModalOpen((prev) => !prev)
    
    return (
        <Container onClick={handleBusinessEdit}>
            <Head>
                <FormattedValue type={'subtitle'} value={business.name}>{business.name}</FormattedValue>
            </Head>
            <Body>
                <p>ID: {business.id}</p>
                <p>DIRECCIÓN: {business.address}</p>
                <p>TEL: {business.tel}</p>
                {`Modal:  ${businessEditModalOpen ? "Abierto" : "Cerrado"}`}
            </Body>
            <BusinessEditModal
                isOpen={businessEditModalOpen}
                onClose={handleBusinessEdit}
            />
        </Container>
    )
}



const Container = styled.div`
    padding: 1em;
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
