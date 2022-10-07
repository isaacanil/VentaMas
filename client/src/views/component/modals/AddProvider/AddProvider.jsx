import React, { useState } from 'react'
import style from './AddProviderStyle.module.scss'
import { useDispatch, useSelector } from 'react-redux'

import { nanoid } from 'nanoid'
export const AddProvider = () => {
    const dispatch = useDispatch()
  
    const [provider, setProvider] = useState({
        name: '',
        lastName: '',
        address: '',
        tel: '',
        email: '',
        id: nanoid(4),
        personalID: ''

    })
    // return (
    //     isOpen ? (
    //         <div className={style.Container}>
    //             AddProvider
    //         </div>
    //     ) : null
    // )
}
