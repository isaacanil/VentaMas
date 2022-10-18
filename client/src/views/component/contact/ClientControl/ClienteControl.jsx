import React, { useState, useEffect } from 'react'
import { getClients } from '../../../../firebase/firebaseconfig'
import { CancelShipping } from '../../../../features/cart/cartSlice'
import style from './ClientControlStyle.module.scss'
import {
  InputText, 
  Client,
  CancelPurchaseBtn,
  AddClientButton
} from '../../../'
import { useDispatch } from 'react-redux'
export const ClientControl = () => {
  const dispatch = useDispatch()
  const [clients, setClients] = useState('')
  const [searchData, setSearchData] = useState('')
  const [filteredClients, setFilteredClients] = useState('')
  useEffect(() => {
    getClients(setClients)

  }, [])
  // 
  const handleSearchClient = (search) => {
    setSearchData(search)
    const filtered = clients.filter((e) => e.client.name.toLowerCase().includes(searchData.toLowerCase()));
    setFilteredClients(filtered)
  }
  const handleCancelShipping = () => {
    dispatch(
      CancelShipping()
    )
  }
  const handleSaveClient = (client) => {
    console.log(client)
  }
  
  return (
    <div className={style.ClientBar}>
      <InputText size='medium' type="text" placeholder='Buscar cliente' onChange={(e) => handleSearchClient(e.target.value)} />
      {
        searchData !== '' ? (
          <div className={style.clientControl}>
            {
              clients.length > 0 ? (
                filteredClients.map(({ client }, index) => (
                  <Client
                    key={index}
                    name={client.name}
                    lastName={client.lastName}
                    client={client}
                    searchData={{ searchData, setSearchData }}
                  ></Client>
                ))

              )
                :
                (
                  <h3>Añade un cliente</h3>
                )}
          </div>
        )
          :
          (
            null
          )

      }

      <AddClientButton></AddClientButton>
      <CancelPurchaseBtn></CancelPurchaseBtn>
      
    </div>
  )
}
