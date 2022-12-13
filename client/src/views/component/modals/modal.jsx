import React, { useState } from 'react'

//style
import Style from './modal.module.scss'

//component and pages
import { Button } from '../../index'
import { MdClose } from 'react-icons/md'

//hooks
//import { useModal } from '../../../hooks/useModal'



export const Modal = ({ children, nameRef, handleSubmit, close, btnSubmitName, isOpen, subModal }) => {

    const done = () => {
        new Promise((resolve) => {
            resolve(
                handleSubmit()
            )
        }).then(() => {
            close();
        })
        console.log('click')

    }
    return (
        isOpen ? (
            <article
                className={`${Style.Modal} ${Style.Open}`} >
                <div className={Style.Modal_container}>
                    <div className={Style.modal_header}>

                        <h3>{nameRef}</h3>
                        <Button title={<MdClose/>} width='icon32' bgcolor='error'   onClick={close}/>

                    </div>
                    <div className={Style.modal_body}>
                        {children}
                            {subModal ? subModal : null}
                    </div>
                    <div className={Style.modal_footer}>
                        <div className={Style.Group}>
                            <Button 
                                title={btnSubmitName} 
                                onClick={done}
                            />
                        </div>
                    </div>
                </div>
            </article>
        ) : null
    )
}
