import React, { useState, useEffect, useMemo } from 'react'
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
import { useClickOutSide } from '../../../../hooks/useClickOutSide.jsx'
import { useRef } from 'react'
import { ClientDetails } from './ClientDetails.jsx'
import { async } from '@firebase/util'
import { MdEdit } from 'react-icons/md'
import { SearchClient } from '../../../templates/system/Inputs/SearchClient.jsx'
import { ClientSelector } from './ClientSelector.jsx'
import { useSearchFilter } from '../../../../hooks/useSearchFilter.js'
export const ClientControl = () => {
  const dispatch = useDispatch()
  const [clients, setClients] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const filteredClients = useSearchFilter(clients, searchTerm)
  const [searchClientLabel, setSearchClientLabel] = useState('Buscar Cliente')
  const ClientSelected = useSelector(SelectClient)
  const [isOpen, setIsOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)
  useEffect(() => {
    getClients(setClients)
  }, [])
  useEffect(()=>{
    
   
    if(ClientSelected){
      ClientSelected.name !== '' ? (
        filteredClients.map(({client})=> client.name !== searchTerm) ?  setSearchClientLabel(`Actualizar (${ClientSelected.name})`) : setSearchClientLabel('sds')
      ) : setSearchClientLabel('Buscar Cliente')
    }
  }, [ClientSelected, searchTerm])
  const getClientName = () => {
    setSearchData(ClientSelected ? ClientSelected.name : null)
    console.log(searchTerm)
    return searchTerm
  }
  useEffect(() => {
    ClientSelected !== null ? setSearchTerm(ClientSelected.name) : undefined
  }, [ClientSelected])
  // const searchClientLabel = useMemo(() => {
  //   if(ClientSelected === null){
  //     filteredClients.length > 0 ?
  //      (filteredClients.some(({client}) => client.name !== searchTerm) ? 'Crear' : null) : null
  //   }
  //   if(ClientSelected !== null){
  //     filteredClients.length > 0 ? 
  //     (filteredClients.some(({client}) => client.name !== searchTerm) ? 'Guardar' : null) : null
  //   }
  // }, [filteredClients, ClientSelected, searchTerm])
 
  const searchClientRef = useRef(null)
  useClickOutSide(searchClientRef, !isOpen, closeMenu)
  return (
    <div className={style.ClientBarContainer} ref={searchClientRef}>
      <div className={style.row}>
        <div className={style.ClientBar}>
          <SearchClient
            onFocus={() => setIsOpen(true)}
            title={searchTerm}
            label={
            //  ClientSelected.name ? (
            //     filteredClients.length > 0 ? (
            //       filteredClients.map(({ client }) => client.name !== searchTerm) ?
            //         (`Buscar Cliente`) : ('Crear')
            //     ) : ('Crear')
            //   ) : (
            //     filteredClients.length > 0 ? (
            //       filteredClients.map(({ client }) => client.name !== searchTerm) ?
            //         (`Actualizar ${ClientSelected.name}`) : ('Actualizar')
            //     ) : (`Actualizar ${ClientSelected.name}`)
            //   )
            searchClientLabel
            }
            handleReset
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ButtonGroup>
            {/* <Button
              borderRadius='normal'
              title={<MdEdit />}
              width={'icon32'}
              color={'gray-dark'}
            />
            <AddClientButton></AddClientButton> */}
            <CancelPurchaseBtn></CancelPurchaseBtn>
          </ButtonGroup>
        </div>
      </div>
      <ClientDetails client={ClientSelected}></ClientDetails>
      {
          <ClientSelector
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            filteredClients={filteredClients}
          />
      }
    </div>
  )
}
