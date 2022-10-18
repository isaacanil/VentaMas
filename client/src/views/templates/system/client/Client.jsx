import styled from "styled-components";
import { useDispatch, useSelector } from 'react-redux';
import { addClient } from "../../../../features/cart/cartSlice";
import { SelectFacturaData } from "../../../../features/cart/cartSlice";
const Container = styled.li`
    list-style: none;
    border: 1px solid #00000073;
    padding: 0.4em 0;
    margin: 0;
    text-align: center;
    font-weight: 600;
    border-radius: 10px;
    background-color: white;
   
`
 export const Client = ({setIsOpen, name, lastName, tel, address, client, searchData}) => {
    const dispatch = useDispatch()
    const BillingData = useSelector(SelectFacturaData)
    
    const handleSubmit = (client) => {
        //console.log(client)
        searchData.setSearchData('')
        setIsOpen(false)
        dispatch(
            addClient(
                client
            )
        )
        //console.log(BillingData)
    }
    return(<Container onClick={() => handleSubmit(client)}>
        {name} {lastName}
    </Container>)
}