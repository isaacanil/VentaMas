import React, { Fragment, useEffect, useState } from 'react'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { getClients, getOrder } from '../../../firebase/firebaseconfig'
import { ClientSelector } from '../../component/contact/ClientControl/ClientSelector'
import { SelectClient } from '../../../features/cart/cartSlice'
import { useSelector } from 'react-redux'
import { SearchClient } from '../../templates/system/Inputs/SearchClient'
import { useSearchFilter } from '../../../hooks/useSearchFilter'

export const Compras = () => {
  
  return (
    <Fragment>
      <MenuApp></MenuApp>
    </Fragment >
  )
}

