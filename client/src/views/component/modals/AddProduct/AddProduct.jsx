import React from 'react'
import styled from 'styled-components'
import style from './AddProductStyle.module.scss'
import { Check } from '../../../templates/system/Icons/Check/Check'
import {NormalProduct} from './NormalProduct'
import {CustomProduct} from './CustomProduct/CustomProduct'
import { useState } from 'react'
export const AddProduct = () => {
    const  [view, setView] = useState('custom')
  return (
    <Backdrop>
        <Modal>
            <Head>
                <OptBar>
                    <div onClick={()=> setView('normal')} className={view === 'normal' ? `${style.btnMode} ${style.active}` : `${style.btnMode}`}>
                        <span>Normal</span>
                        <Check/>
                    </div>
                    <div onClick={()=> setView('custom')} className={view === 'custom' ? `${style.btnMode} ${style.active}` : `${style.btnMode}`}>
                        <span>Personalizado</span>
                        <Check/>
                    </div>
                </OptBar>

            </Head>
            <Body>
                {
                    view === 'normal' ? <NormalProduct/> : view === 'custom' ? <CustomProduct/> : <NormalProduct/>
                }
            </Body>
        </Modal>
    </Backdrop>
  )
}

const Backdrop = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    `
const Modal = styled.div`
    border: 1px solid rgba(0, 0, 0, 0.100);
    max-width: 600px;
    max-height: 600px;
    display: grid;
    grid-template-rows: min-content 1fr;
    height: 100%;
    width: 100%;
    background-color: #dddddd;
    border-radius: 10px;
    overflow: hidden;
`
    const Head = styled.div`
    width: 100%;
    
    `
    const OptBar = styled.div`
    height: 2.5em;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 200px);
    align-items: center;
    justify-content: center;
    background-color: #ebecec;
    gap: 1em;
    padding: 0.4em;
 
    `

const Body = styled.div`

`