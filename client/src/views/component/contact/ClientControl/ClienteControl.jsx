import React, { useState, useEffect, useMemo } from 'react'
import { useFbGetClients } from '../../../../firebase/client/useFbGetClients'
import {getClient, setChange, totalPurchase } from '../../../../features/cart/cartSlice'
import style from './ClientControlStyle.module.scss'
import { useDispatch, useSelector } from 'react-redux'
import { useClickOutSide } from '../../../../hooks/useClickOutSide.jsx'
import { useRef } from 'react'
import { ClientDetails } from './ClientDetails/ClientDetails.jsx'
import { SearchClient } from '../../../templates/system/Inputs/SearchClient.jsx'
import { ClientSelector } from './ClientSelector.jsx'
import { filtrarDatos, useSearchFilter } from '../../../../hooks/useSearchFilter.js'
import { updateObject } from '../../../../utils/object/updateObject'
import { deleteClient, selectClient, selectClientMode, selectIsOpen, selectLabelClientMode, setClient, setClientMode, setIsOpen } from '../../../../features/clientCart/clientCartSlice'
import { CLIENT_MODE_BAR } from '../../../../features/clientCart/clientMode'

export const ClientControl = () => {
  const CLIENT_MODE = {
    SEARCH: {
      label: 'Buscar Cliente',
      mode: 'search',
      showClientList: true
    },
    UPDATE: {
      label: 'Actualizar',
      mode: 'update',
      showClientList: false
    },
    CREATE: {
      label: 'Crear Cliente',
      mode: 'create',
      showClientList: false
    }
  }
  const dispatch = useDispatch()

  const { clients } = useFbGetClients()

  const client = useSelector(selectClient)
  const mode = useSelector(selectClientMode)

  const [searchTerm, setSearchTerm] = useState('')
  const filteredClients = filtrarDatos(clients, searchTerm)
  const clientLabel = useSelector(selectLabelClientMode)
  const [inputIcon, setInputIcon] = useState()

  const isOpen = useSelector(selectIsOpen)

  const closeMenu = () => dispatch(setIsOpen(false))

  const createClientMode = () => dispatch(setClientMode(CLIENT_MODE_BAR.CREATE.id))

  const updateClientMode = () => dispatch(setClientMode(CLIENT_MODE_BAR.UPDATE.id))

  const searchClientMode = () => dispatch(setClientMode(CLIENT_MODE_BAR.SEARCH.id));

  const handleDeleteData = () => {
    dispatch(deleteClient())
  }
  const handleChangeClient = (e) => {
    if (mode === CLIENT_MODE_BAR.SEARCH.id) {
      setSearchTerm(e.target.value)
    }
    if (mode === CLIENT_MODE_BAR.UPDATE.id) {
      dispatch(setClient(updateObject(client, e)))
    }
  }

  useEffect(() => {
    switch (mode) {
      case CLIENT_MODE_BAR.SEARCH.id:
        setInputIcon(CLIENT_MODE_BAR.SEARCH.icon)
        // dispatch(deleteClientInState())
        setSearchTerm('')
        break;

      case CLIENT_MODE_BAR.UPDATE.id:
        setInputIcon(CLIENT_MODE_BAR.UPDATE.icon)

        dispatch(totalPurchase())
        dispatch(setChange())
        closeMenu()
        break;

      case CLIENT_MODE_BAR.CREATE.id:
        setInputIcon(CLIENT_MODE_BAR.CREATE.icon)
       
        closeMenu()
        break;

      default:

        break;
    }
  }, [mode])

  useEffect(() => { dispatch(getClient(client)) }, [client])

  const searchClientRef = useRef(null)
  useClickOutSide(searchClientRef, !isOpen, closeMenu)

  const OpenClientList = () => {
    switch (mode) {
      case CLIENT_MODE_BAR.CREATE.id:
        closeMenu()
        break;
      case CLIENT_MODE_BAR.SEARCH.id:
        dispatch(setIsOpen(true))
        break;
      case CLIENT_MODE_BAR.UPDATE.id:
        closeMenu()
        break;

      default:
        break;
    }
  }

  return (
    <div className={style.ClientBarContainer} ref={searchClientRef}>
      <div className={style.row}>
        <div className={style.ClientBar}>
          <SearchClient
            icon={inputIcon}
            name='name'
            title={mode === CLIENT_MODE_BAR.SEARCH.id ? searchTerm : client.name}
            onFocus={OpenClientList}
            label={clientLabel}
            fn={handleDeleteData}
            onChange={(e) => handleChangeClient(e)}
          />

        </div>
      </div>
      <ClientDetails />
      {
        <ClientSelector
          updateClientMode={updateClientMode}
          createClientMode={createClientMode}
          mode={mode.mode}
          searchTerm={searchTerm}
          filteredClients={filteredClients}
        />
      }
    </div>
  )
}
