import styled from "styled-components";
import { useDispatch, useSelector } from 'react-redux';
import { SelectFacturaData } from "../../../../features/cart/cartSlice";
import { highlightSearch } from "../highlight/Highlight";
import { addClient } from "../../../../features/clientCart/clientCartSlice";
const Container = styled.li`
    list-style: none;
    border: 1px solid rgba(0, 0, 0, 0.200);
    display: flex;
    align-items: center;
    padding: 0 1em;
    height: 2.6em;
    margin: 0;
    font-weight: 450;
    font-size: 14px;
    border-radius: 6px;
    background-color: #777777;
    color: white;
    //box-shadow: inset 1px 2px 5px rgba(0, 0, 0, 0.152);
    text-transform: uppercase;
   span{
    background-color: #003fec55;
   }
`
export const Client = ({ client, Close, updateClientMode, searchTerm}) => {
    const dispatch = useDispatch()
    const BillingData = useSelector(SelectFacturaData)
    const handleSubmit = (client) => {
        dispatch(addClient(client))
        updateClientMode()
        Close()
    }
    
    return (
        <Container onClick={() => handleSubmit(client)}>
            {
               highlightSearch(client.name, searchTerm)
            }    
        </Container>
    )
}