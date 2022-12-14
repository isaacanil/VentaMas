import React, { useState, useEffect, useMemo } from 'react'
import { getClients } from '../../../../firebase/firebaseconfig.js'
import { CancelShipping, createClientInState, deleteClientInState, handleClient, isNewClient, ORIGINAL_CLIENT, SelectClient, selectClientInState, SelectClientMode, setClientModeInState, updateClientInState } from '../../../../features/cart/cartSlice'
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
  const CLIENT_MODE = {
    SEARCH: {
      label: 'Buscar Cliente',
      mode: 'search',
      name: 'search',
      showClientList: true
    },
    UPDATE: {
      label: 'Actualizar Cliente',
      mode: 'update',
      name: 'name',
      showClientList: false
    },
    CREATE: {
      label: 'Crear Cliente',
      mode: 'create',
      name: 'name',
      showClientList: false
    }
  }

  const dispatch = useDispatch()
  const [clients, setClients] = useState('')
  const SelectedClientMode = useSelector(SelectClientMode)
  const [searchTerm, setSearchTerm] = useState('')
  const filteredClients = useSearchFilter(clients, searchTerm)
  const [searchClientLabel, setSearchClientLabel] = useState('Buscar Cliente')
  const clientSelected = useSelector(SelectClient)
  const [MODE, setMODE] = useState(SelectedClientMode)
  const [showClientList, setShowClientList] = useState(false)
  const [client, setClient] = useState({
    name: '',
    tel: '',
    address: '',
    personalID: '',
    delivery: {
      status: false,
      value: ''
    }
  })
  const closeMenu = () => setShowClientList(false)

  useEffect(() => { getClients(setClients) }, [])

  const createClientMode = () => dispatch(setClientModeInState(CLIENT_MODE.CREATE.mode))

  const updateClientMode = () => dispatch(setClientModeInState(CLIENT_MODE.UPDATE.mode))

  const searchClientMode = () => dispatch(setClientModeInState(CLIENT_MODE.SEARCH.mode))

  const handleDeleteData = () => {
    searchClientMode()
    dispatch(deleteClientInState())
    setClient({
      name: '',
      tel: '',
      address: '',
      personalID: '',
      delivery: 0
    })

  }
  const handleChangeClient = (e) => {
    setClient({
      ...client,
      [e.target.name]: e.target.value
    })
    setSearchTerm(e.target.value)
  }
  useEffect(()=>{
    setMODE(SelectedClientMode)
  }, [SelectedClientMode])
  useEffect(()=>{
    switch (MODE) {
      case CLIENT_MODE.SEARCH.mode:
        // dispatch(deleteClientInState())
        setSearchTerm('')
        setSearchClientLabel(`${CLIENT_MODE.SEARCH.label}`)
        break;

      case CLIENT_MODE.UPDATE.mode:
       
        setSearchTerm(clientSelected.name === '' ? clientSelected.name : client.name)
        setSearchClientLabel(`${CLIENT_MODE.UPDATE.label} (${clientSelected.name})`)
        closeMenu()
        break;

      case CLIENT_MODE.CREATE.mode:
        //dispatch(deleteClientInState())
        setClient(
          {
            name: '',
            tel: '',
            address: '',
            personalID: '',
            delivery: 0
          }
        )
    
        setSearchClientLabel(CLIENT_MODE.CREATE.label)
        closeMenu()
        break;

      default:

        break;
    }
  }, [MODE])
  useEffect(() => {
    switch (MODE) {
      case CLIENT_MODE.SEARCH.mode:
        // dispatch(deleteClientInState())
        break;

      case CLIENT_MODE.UPDATE.mode:
        dispatch(updateClientInState(client))
        break;

      case CLIENT_MODE.CREATE.mode:
        dispatch(createClientInState(client))
 
        break;

      default:

        break;
    }
  }, [client])
  useEffect(() => { setClient(clientSelected) }, [clientSelected])

  const searchClientRef = useRef(null)
  useClickOutSide(searchClientRef, !showClientList, closeMenu)
  const OpenClientList = () => {
    switch (MODE) {
      case CLIENT_MODE.CREATE.mode:
        closeMenu()
        break;
      case CLIENT_MODE.SEARCH.mode:
        setShowClientList(true)
        break;
      case CLIENT_MODE.UPDATE.mode:
        closeMenu()
        break;

      default:
        break;
    }
  }
  console.log('MODE:: => ', MODE)
  return (
    <div className={style.ClientBarContainer} ref={searchClientRef}>
      <div className={style.row}>
        <div className={style.ClientBar}>
          <SearchClient
            name='name'
            onFocus={OpenClientList}
            title={searchTerm}
            label={searchClientLabel}
            fn={handleDeleteData}
            onChange={(e) => handleChangeClient(e)}
          />
          <ButtonGroup>
            <CancelPurchaseBtn></CancelPurchaseBtn>
          </ButtonGroup>
        </div>
      </div>
      <ClientDetails
        clientSelected={clientSelected}
        client={client}
        setClient={setClient}
      />
      {
        <ClientSelector
          updateClientMode={updateClientMode}
          createClientMode={createClientMode}
          mode={MODE.mode}
          showClientList={showClientList}
          setShowClientList={setShowClientList}
          searchTerm={searchTerm}
          filteredClients={filteredClients}
        />
      }
    </div>
  )
}
