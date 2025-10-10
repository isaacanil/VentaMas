import { nanoid } from 'nanoid'
import { useState } from 'react'
import { useDispatch } from 'react-redux'

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
