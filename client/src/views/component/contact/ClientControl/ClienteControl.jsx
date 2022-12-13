import React, { useState, useEffect } from 'react'
import { getClients } from '../../../../firebase/firebaseconfig.js'
import { addClient, CancelShipping, SelectClient } from '../../../../features/cart/cartSlice'
import style from './ClientControlStyle.module.scss'
import {
  InputText,
  Client,
  CancelPurchaseBtn,
  AddClientButton
} from '../../../'
import { useDispatch, useSelector } from 'react-redux'
import { Input } from '../../../templates/system/Inputs/InputV2.jsx'
import { Button, ButtonGroup } from '../../../templates/system/Button/Button.jsx'
import { useOutSideAlerter } from '../../../../hooks/useOutSideAlerter.jsx'
import { useRef } from 'react'
import { ClientDetails } from './ClientDetails.jsx'
import { async } from '@firebase/util'
import { MdEdit } from 'react-icons/md'
export const ClientControl = () => {
  const dispatch = useDispatch()
  const [clients, setClients] = useState('')
  const [searchData, setSearchData] = useState('')
  const [filteredClients, setFilteredClients] = useState([])
  const ClientSelected = useSelector(SelectClient)
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    getClients(setClients)

  }, [])
  // 
  useEffect(() => {
    if (searchData === '') {
      setFilteredClients(clients)
    }
    if (searchData !== '') {
      const filtered = clients.filter((e) => e.client.name.toLowerCase().includes(searchData.toLowerCase()));
      setFilteredClients(filtered)
    }
  }, [searchData, clients])


  const closeMenu = () => {
    setIsOpen(false)
  }
  const searchClientRef = useRef(null)
  //console.log(ClientSelected)
  useOutSideAlerter(searchClientRef, !isOpen, closeMenu)
  return (
    <div className={style.ClientBarContainer}>
      <div className={style.row}>
        <div className={style.ClientBar}>
          <Input
            size='medium'
            type="search"
            labelColor={'primary'}
            title={ClientSelected !== null ? ClientSelected.name : 'Buscar Cliente'}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => setSearchData(e.target.value)}
            ref={searchClientRef}
          />
          <ButtonGroup>
            <Button
              title={<MdEdit />}
              width={'icon32'}
              color={'gray-dark'}
            />
            <AddClientButton></AddClientButton>
            <CancelPurchaseBtn></CancelPurchaseBtn>
          </ButtonGroup>
        </div>
      </div>
      <ClientDetails client={ClientSelected}></ClientDetails>

      {
        isOpen ? (
          <div className={style.clientControl} ref={searchClientRef}>
            {
              clients.length > 0 ? (
                filteredClients.length > 0 ? (
                  filteredClients.map(({ client }) => (
                    <Client
                      key={client.id}
                      client={client}
                      searchData={searchData}
                      Close={setIsOpen}
                    />
                  ))
                ) : null
              ) : null
            }
          </div>
        ) : null
      }


    </div>
  )
}
