import React, { useState, Fragment } from 'react'
import { AddClientButton, Client } from '../../../../'
import styled from 'styled-components'
import { getClients } from '../../../../../firebase/firebaseconfig'
import { InputText } from '../Style'
import { useEffect } from 'react'
import { SelectClient, CancelShipping } from '../../../../../features/cart/cartSlice'
import { openModalAddClient } from '../../../../../features/modals/modalSlice'
import { useSelector, useDispatch } from 'react-redux'
export const ClientBar = () => {
    const dispatch = useDispatch()
    const ClientSelected = useSelector(SelectClient)
    const [searchData, setSearchData] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [clients, setClients] = useState()
    const [filteredClients, setFilterClients] = useState('')
    const client = useSelector(state => state.cart)
    const [taxReceipt, setTaxReceipt] = useState()
    useEffect(() => {
        getClients(setClients)
    }, [])
    console.log(clients)
    const handleSearchClients = (search) => {
        setSearchData(search)
        const filtered = clients.filter((e) => e.client.name.toLowerCase().includes(searchData.toLowerCase()) || e.client.address.toLowerCase().includes(searchData.toLowerCase()))
        setFilterClients(filtered)
       
       
    }
    const handleOpenMenu = () => {
        setIsOpen(true)
        (
            setFilterClients(clients)
        )

    }
    

//console.log('cliente' + ClientSelected)
//console.log(clients)

return (
    <ClientSection>
        <ClientGroup>
            <ClientActionBar>
                <InputText
                    type="text"
                    border='circle'
                    value={searchData}
                    placeholder='Buscar Cliente'
                    onChange={(e) => handleSearchClients(e.target.value)}
                    onFocus={handleOpenMenu}
                    
                />
                <AddClientButton></AddClientButton>
                {
                    isOpen ? (
                        <ClientList>
                            <ClientListWrapper>
                                {
                                    clients.length > 0 ? (
                                        filteredClients.map(({ client }, index) => (
                                            <Client
                                                setIsOpen={setIsOpen}
                                                key={index}
                                                name={client.name}
                                                lastName={client.lastName}
                                                address={client.address}
                                                email={client.email}
                                                taxReceipts={client.taxReceipts}
                                                tel={client.tel}
                                                client={client}
                                                searchData={{ searchData, setSearchData }}
                                            ></Client>
                                        ))
                                    ) : null
                                }
                            </ClientListWrapper>
                        </ClientList>
                    ) : null
                }
            </ClientActionBar>


        </ClientGroup>
        <ClientGroup>
            {ClientSelected ? (
                <ClientInfo>
                    <ClientItem>{ClientSelected.name} {ClientSelected.lastName} </ClientItem>
                    <ClientItem>Teléfono: {ClientSelected.tel} </ClientItem>
                </ClientInfo>
            ) : null}
        </ClientGroup>
        <TaxReceipts>
            <input type="checkbox" name="" id="TaxReceipt" onChange={e => setTaxReceipt(e.target.checked)} />
            <label htmlFor="TaxReceipt">Comprobante Fiscal:</label>
            {
                taxReceipt ? (
                    ClientSelected ? (
                        <span>{ClientSelected.taxReceipts}</span>
                    ) : <InputText type="text" placeholder='RNC/Cédula' />
                ) : null
            }
        </TaxReceipts>
    </ClientSection>
)
}


const ClientSection = styled.div`
    height: 2.4em;
    display: flex;
    flex-wrap: wrap;
    background-color: rgba(0, 0, 0, 0.13);
    border-radius: 10px ;
    position: relative;
    align-items: center;
    gap: 1em;
    padding: 0.2em 0.4em;
`
const ClientGroup = styled.div`
    display: grid;
    gap: 1em;
`
const ClientActionBar = styled.div`
    display: flex;
    align-items: center;
    gap: 0.2em;
`
const TaxReceipts = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4em;
`
const ClientInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5em;
`
const ClientItem = styled.div`
    border-radius: 10px;
    padding: 0.1em 0.8em;
    background-color: #5395cc;
    color: white;
`
const ClientList = styled.ul`
    background-color: #707070;
    position: absolute;
    top: 2.2em;
    left: 0;
    max-width: 500px;
    width: 100%;
    height: 250px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.200);
    z-index: 3;
    overflow: hidden;
    padding: 0;
   
`
const ClientListWrapper = styled.ul`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(10, min-content);
    height: 100%;
    gap: 0.5em;
    justify-content: start;
    
    padding: 0.3em;

    overflow-y: scroll;
`