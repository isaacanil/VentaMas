import styled from "styled-components";
import { useDispatch, useSelector } from 'react-redux';
import { selectClientInState, SelectFacturaData } from "../../../../features/cart/cartSlice";
import { deleteClient, deleteMultipleClients } from "../../../../firebase/firebaseconfig";
const Container = styled.li`
    list-style: none;
    border: 1px solid #00000073;
    padding: 0.2em 1em;
    margin: 0;
    font-weight: 600;
    font-size: 14px;
    border-radius: 10px;
    background-color: #ffffff;
    box-shadow: inset 1px 2px 5px rgba(0, 0, 0, 0.212);
    text-transform: uppercase;
   
`
export const Client = ({ client, Close, updateClientMode}) => {
    const dispatch = useDispatch()
    const BillingData = useSelector(SelectFacturaData)
    const handleSubmit = (client) => {

        dispatch(selectClientInState(client))
        updateClientMode()
        Close()
    }
    return (
        <Container onClick={() => handleSubmit(client)}>
            {client.name}
        </Container>
    )
}