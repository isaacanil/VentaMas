import React, { useMemo } from 'react'
import styled from 'styled-components'
import { Row } from '../../../../templates/system/Table/Row'
import { db } from '../../../../../firebase/firebaseconfig'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCashCount, setCashCountClosingBanknotes, setCashCountOpening } from '../../../../../features/cashCount/cashCountSlide'
import { useFormatNumber } from '../../../../../hooks/useFormatNumber'
import { CashCountMetaData } from '../../page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData'
import { DateSection } from '../../page/CashRegisterClosure/components/Header/DateSection'
import { convertTimeStampToDate } from '../../../../../utils/date/convertTimeStampToDate'
import { CashCountStateIndicator} from '../../global/CashCountStatusIndicator/CashCountStateIndicator'


export const Item = ({ colWidth, data: cashCount }) => {

  const {totalSystem, totalDiscrepancy } = CashCountMetaData(cashCount)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleClick = () => {
    let cashCountUpdated = {
      ...cashCount,
      opening: {
        ...cashCount.opening,
        date: JSON.stringify(cashCount.opening.date)
      }
    }
    
    navigate(`/cash-register-closure/${cashCountUpdated?.id}`)
    
    dispatch(setCashCount(cashCountUpdated))
  }

  const formattedNumber = useMemo(() => useFormatNumber(cashCount?.incrementNumber), [cashCount?.incrementNumber]);
  const formattedPriceOpening = useMemo(() => useFormatPrice(cashCount?.opening?.banknotesTotal), [cashCount?.opening?.banknotesTotal]);
  const formattedPriceClosing = useMemo(() => cashCount?.closing?.banknotesTotal === 0.0 ? '-' : useFormatPrice(cashCount?.closing?.banknotesTotal), [cashCount?.closing?.banknotesTotal]);

  return (
    <Container onClick={() => cashCount?.state === 'open' || cashCount?.state === 'closing' || cashCount?.state === 'closed' ?  handleClick() : null}>
      <Row col={colWidth} >
        <Col>{formattedNumber}</Col>
        <Col>
          <CashCountStateIndicator state={cashCount?.state}/>
        </Col>
        <Col>{cashCount?.updatedAt ? <DateSection  date={convertTimeStampToDate(cashCount?.updatedAt)} /> : '-'} </Col>
        <Col>{cashCount?.opening?.employee?.name}</Col>
 
        <Col>{useFormatPrice(totalSystem)}</Col>
        <Col>
          {useFormatPrice(totalDiscrepancy)}
        </Col>
      </Row>
    </Container>
  )
}
const Container = styled.div`
height: 3em;
display: flex;
padding: 1em;
align-items: center;
    :hover{
        background-color: #f2f2f2;
    }
    border-bottom: 1px solid #f2f2f2;
    :last-child{
        border-bottom: none;
    }
`
const Col = styled.div`
width: 100%;
display: flex;
align-items: center;
    ${(props) => {
    switch (props.text) {
      case 'right':
        return `
          text-align: right;
        `
      case 'left':
        return `
          text-align: left;
          `
      default:
        break;
    }
  }}
   ${(props) => {
    switch (props.align) {
      case 'right':
        return `
        display: flex;
        justify-content: flex-end;
          text-align: right;
        `
      case 'left':
        return `
          text-align: left;
          `
      default:
        break;
    }
  }}
`
