import React, { useState } from 'react'
import { useEffect } from 'react'
import { TbTarget } from 'react-icons/tb'
import styled from 'styled-components'

export const Input = ({ type, name, text, size, title, clearInputWhen, required, focusColor, labelColor, value, onChange, readOnly, onFocus}) => {
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
                name={name}
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
    top: -16px;
    left: 0;
    color: rgb(150, 150, 150);
    font-size: 12px;
    transition: all 0.5s ease;
    height: min-content;
    line-height: 12px;
    padding: 0 3px;
    pointer-events: none;
    }
    input{  
        border: none;
        outline: 1.5px solid rgba(0, 0, 0, 0.200);
        border-radius: var(--border-radius-light);
        padding:  0.4em 0.5em;
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
    /* &:not(:placeholder-shown) + label{
        top: -6px;
        left: 0;
        font-size: 11px;
        padding: 0.2em;
        line-height: 11px;
        border-radius: 2px;
        background-color: white;
        color: #8d8d8d;
    } */
    &:focus + label{
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
            
            width: 11em;
            
            
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
