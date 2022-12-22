import React, { useState } from 'react'
import styled from 'styled-components'
import { separator } from '../../../../hooks/separator'
import style from './ListItemStyle.module.scss'
import {

  ButtonGroup,
  Button,
  PurchaseButton,
  EditButton,
  DeleteButton,
  ChevronDownButton,
  StatusIndicatorDot
} from '../../../'
export const ListItem = ({ e, index }) => {
  const [openMoreInfo, setOpenMoreInfo] = useState(false)
  const HandleChangeOpenMoreInfoStatus = () => {
    setOpenMoreInfo(!openMoreInfo)

  }
  console.log(openMoreInfo)
  return (
    <div className={`${style.Container}`} onClick={HandleChangeOpenMoreInfoStatus}>
      <div className={style.Btn}>
        <ChevronDownButton></ChevronDownButton>
      </div>
      <div className={style.Items}>
        <div className={style.Group}>
          <label>Pedido:</label>
          <div>
            {index + 1}
          </div>
        </div>
        <div className={openMoreInfo ? `${style.MoreInfo} ${style.Visible}` : `${style.MoreInfo}`}>
          <div className={style.Group}>
            <label>Estados :</label>
            <div>
              <StatusIndicatorDot color={e.data.state ? e.data.state.color : null}></StatusIndicatorDot>
            </div>
          </div>
          <div className={`${style.Group} ${style.LimitText}`} >
            <label>Proveedor :</label>
            <div>{e.data.provider ? e.data.provider.name : null}</div>
          </div>
          <div className={`${style.Group} ${style.center}`} >
            <label>Nota :</label>
            <Button
              title='Ver'
              height='small'
            />
          </div>
          <div className={style.Group}>
            <label>F. Pedido :</label>
            <div>{new Date(e.data.createdAt).toLocaleDateString()}</div>
          </div>
          <div className={style.Group}>
            <label>F. Entrega :</label>
            <div>{new Date(e.data.date).toLocaleDateString()}</div>
          </div>
          <div className={style.Group}>
            <label>Total :</label>
            <div>${separator(e.data.totalPurchase)}</div>
          </div>
          <div className={style.Group}>
            <label>Acción :</label>
            <ButtonGroup>
              <PurchaseButton></PurchaseButton>
              <EditButton></EditButton>
              <DeleteButton></DeleteButton>
            </ButtonGroup>
          </div>
        </div>

      </div>
    </div>
  )
}

const Row = styled.div`
  display: grid;
  align-items: center;
  span{
    display: none;
    
  }
  gap: 1em;
  ${(props) => {
    switch (props.container) {
      case 'first':
        return `
        display: grid;
        @media (max-width: 800px){
          grid-template-columns: min-content 1fr;
          span{
            display: block;
            transform: rotate(90deg);
            width: 
          }
        }
        
        `
      default:
    }
  }}
    ${(props) => {
    switch (props.border) {
      case 'border-bottom':
        return `
        border-bottom: 1px solid rgba(0, 0, 0, 0.200);
        &:last-child{
          border-bottom: none;
        }
        `
      default:
    }
  }}
  ${(props) => {
    switch (props.color) {
      case 'header':
        return `
        background-color: #9c0e0e;
        `
      case 'item':
        return `
        background-color: #ebebeb;
        `
      default:

    }
  }}
`
const Col = styled.div`
  ${(props) => {
    switch (props.size) {
      case 'limit':
        return `
          width: 100px;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;  
          //white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          `

      default:
        break;
    }
  }}
`
const Group = styled.div`
  display: grid;
  gap: 1em;
  label{
    display: none;
  }
  ${(props) => {
    switch (props.column) {
      case "order-list":
        return `

          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
          align-items: center;
          height: 3em;
          padding: 0 1em;
          @media (max-width: 811px ){
            grid-template-columns: 1fr;
            height: auto;
            padding: 1em;
          
        }
      
        
        `

      default:
        break;
    }
  }}
  ${(props) => {
    switch (props.name) {
      case 'number':
        return `
        
        `
      case 'items':
        return `
        grid-template-columns: min-content;
        @media (max-width: 811px ){
          display: grid;
          grid-template-columns: 0.3fr 1fr;
          label{
            display: block;
          }
          display: none;
          &:nth-child(1){
            display: grid;
          }
         
  
        }
        
        `
      default:
        return ``
    }
  }}
  align-items: center;
`
{/* <Row key={index} color='item' border='border-bottom' container='first'>
      <span>
        <ArrowRightButton></ArrowRightButton>
      </span>
      <Group column='order-list'>

        <Group name='items'>
          <label>Número :</label>
          <Col>{index + 1}</Col>
        </Group>
        <Group name='items'>
          <label>Est :</label>
          <Col>
            <StatusIndicatorDot color={e.estado}></StatusIndicatorDot>
          </Col>
        </Group>
        <Group name='items'>
          <label>Proveedor :</label>
          <Col size='limit'>{e.Proveedor}</Col>
        </Group>
        <Group name='items'>
          <label>Nota :</label>
          <Col>
            
          </Col>
        </Group>
        <Group name='items'>
          <label>F. Pedido :</label>
          <Col>{e.orderDate}</Col>
        </Group>
        <Group name='items'>
          <label>Número :</label>
          <Col>{e.deliveryDate}</Col>
        </Group>
        <Group name='items'>
          <label>F. Entrega :</label>
          <Col>${separator(e.total)}</Col>
        </Group>
        <Group name='items'>
          <label>Acción :</label>
          <ButtonGroup>
            <PurchaseButton></PurchaseButton>
            <EditButton></EditButton>
            <DeleteButton></DeleteButton>
          </ButtonGroup>
        </Group>

      </Group>


    </Row> */}