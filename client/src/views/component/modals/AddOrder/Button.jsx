import React, {useState} from 'react'
import { TbPlus } from 'react-icons/tb'
import styled from 'styled-components'

export const AddProductButton_OrderPage = ({message}) => {
    const [appearMessage, setAppearMessage] = useState(false)
    return (
      <Component 
        onMouseOver={() => setAppearMessage(true)} 
        onMouseOut={()=> setAppearMessage(false)}>
        {appearMessage ? <Message>{message}</Message> : null}
        <TbPlus/>
      </Component>
    )
  }
const Component = styled.button`
    position: relative;
    $num : 1.2em;
    height: $num;
    width: $num;
    border: 2px solid rgb(39, 39, 39);
    color: #1f1e1e;
    font-size: 1.1em;
    background-color: transparent;
    border-radius: 50%;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    `
const Message = styled.div`
    border-radius: 10px;
    position: absolute;
    top: 1.8em;
    left: -3em;
    width: 120px;
    background-color: #f0f0f0;
    color: #000;
    box-shadow: 0px 0px 10px #00000081;
    padding: 0.4em 0.6em;
    display: flex;
    justify-content: flex-start;
    font-size: 14px;
    z-index: 1;
`
