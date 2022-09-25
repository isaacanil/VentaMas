import React, { useState } from 'react'

//style
import Style from './modal.module.scss'

//component and pages
import { Button } from '../../index'

//hooks
//import { useModal } from '../../../hooks/useModal'



export const Modal = ({ children, nameRef, handleSubmit, close, btnSubmitName }) => {


    const done = () => {
        new Promise(function (resolve) {

            resolve(handleSubmit());

        }).then(function (result) {

            close();

        })


        console.log('click')

    }
    return (
        <article
            className={`${Style.Modal} ${Style.Open}`} >
            <div className={Style.Modal_container}>
                <div className={Style.modal_header}>

                    <h3>{nameRef}</h3>
                    <button className={Style.CrossBtn} onClick={close}>X</button>

                </div>
                <div className={Style.modal_body}>
                    {children}
                </div>
                <div className={Style.modal_footer}>
                    <div className={Style.Group}>
                        <Button onClick={done}>{btnSubmitName}</Button>
                    </div>
                </div>
            </div>
        </article>
    )
}
