import React, { useState } from 'react'
import { useEffect } from 'react'
import { TbTarget } from 'react-icons/tb'
import styled from 'styled-components'

export const Input = ({ type, text, size, title, clearInputWhen, required, focusColor, labelColor, value, onChange, readOnly, onFocus}) => {
    const [focus, setFocus] = useState({
        color: focusColor,
    })
    useEffect(()=>{
        focus.focusColor === undefined ? setFocus({...focus, color:'#1155e7'}) : null
    }, [focusColor])
    return (
        <Container focusColor={focus.color} size={size} text={text} labelColor={labelColor}>
            <input
                id=""
                name=""
                value={clearInputWhen ? undefined : value}
                type={type}
                required={required}
                placeholder='a'
                onChange={onChange}
                readOnly={readOnly}
                onFocus={onFocus} 
            />
            <label htmlFor="">{title}</label>
        </Container>
    )
}
const Container = styled.div`
    display: flex;
    position: relative;
    width: 100%;
    label{
        margin: 0;
    position: absolute;
    top: 6px;
    left: 10px;
    color: rgb(150, 150, 150);
    transition: all 0.5s ease;
    height: min-content;
    padding: 0 3px;
    pointer-events: none;
    }
    input{  
        border: none;
        outline: 1.5px solid rgba(0, 0, 0, 0.200);
        border-radius: 10px;
        padding:  0.5em 0.5em;
        color: rgb(92, 92, 92);
        width: 100%;
        //text-transform: capitalize;
        max-width: 100%;
        min-width: 100%;
        transition: all 0.5s ease-in-out;
    &::placeholder{ 
        color: transparent;
    }
    &:focus{
        //border: 1px solid rgba(0, 0, 0, 0.300);
        outline:  2px solid  ${props => props.focusColor};
    }     
    &:not(:placeholder-shown) + label{
        top: -13px;
        font-size: 11px;
        background-color: white;
        color: #8d8d8d;
    }
    &:focus + label{
        top: -13px;
        background-color: white;
        font-size: 11px;
        color:  ${props => props.focusColor}; 
    }
  
    }
    ${(props) => {
        switch (props.text) {
            case 'capitalize':
                return`
                    input{
                    text-transform: capitalize;
                    
                }
                `
        
            default:
                break;
        }
    }}
    ${(props) => {
        switch (props.size) {
            case 'small':
                return `
            
            width: 16em;
          `
            case 'medium':
                return `
            width: 12em;`
            default:
                return null
        }
    }}
    ${(props) => {
        switch (props.labelColor) {
            case 'primary':
                return`
                    label{
                        color: #535353;
                        font-weight: 600;
                        
                    }
                `
        
            default:
                break;
        }
    }}
`
export const InputGroup = styled.div`
    display: flex;
    gap: 1em;
    align-items: center;
   
    `
