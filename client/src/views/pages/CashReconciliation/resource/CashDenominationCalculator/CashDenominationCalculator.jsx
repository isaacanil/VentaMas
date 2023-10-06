import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { InputV4 } from '../../../../templates/system/Inputs/GeneralInput/InputV4'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { FormattedValue } from '../../../../templates/system/FormattedValue/FormattedValue'
import { OpenControllerSmall } from './OpenControllerSmall'
import { OpenControllerWithMessage } from './OpenControllerWithMessage'
import { motion } from 'framer-motion'
import { useClickOutSide } from '../../../../../hooks/useClickOutSide'
import { useFormatNumber } from '../../../../../hooks/useFormatNumber'

export const CashDenominationCalculator = ({ isExpanded = null, inputDisabled = null, banknotes, setBanknotes, setIsExpanded, datetime, title, width, columns }) => {

    const bills = banknotes;
    const billsContainerRef = useRef(null)

    const handleExpanded = () => { setIsExpanded(!isExpanded) }

    const Total = bills.reduce((acc, bill) => acc + (bill.value * bill.quantity), 0)

    const banknoteVariants = {
        open: { opacity: 1, height: 'auto' },
        closed: { overflow: 'hidden', height: '4em' },
    }

    console.log(bills)
    const newBills = [...bills]
    return (
        <Container width={width}
            ref={billsContainerRef}
        >
            <Header>
                <Group>
                    <FormattedValue size={'small'} type={'title'}  value={title} />
                </Group>
                <Group>
                    {/* {inputDisabled ? <FormattedValue size={'xsmall'}  type={'title'} value={'No editable'} /> : null} */}
                    {datetime && <FormattedValue size={'xsmall'} value={datetime} />}
                    <OpenControllerSmall
                        onClick={handleExpanded}
                        isExpanded={isExpanded}
                    />
                </Group>
            </Header>
            <Bills
                animate={isExpanded ? "open" : "closed"}
                variants={banknoteVariants}
                transition={{ duration: 0.5 }}
                columns={columns}  >
                {newBills
                    .sort((a, b) => a.value < b.value)
                    .map((bill, index) => (
                        <BillRow key={index}>
                            <FormattedValue
                                type={'subtitle'}
                                value={`$ ${bill.ref}`}
                                size={'small'}
                                align={'right'}
                            />
                            {/* <BillRef>{bill.ref}</BillRef>  */}
                            <InputV4
                                type="number"
                                value={bill.quantity}
                                disabled={inputDisabled ? true : null}
                                onChange={(e) => {
                                    const newBills = [...bills]
                                    const newBill = { ...bills[index] }
                                    newBill.quantity = Number(e.target.value) || ""
                                    newBills[index] = newBill
                                    setBanknotes(newBills)
                                }}
                                placeholder={'cantidad'}
                            />
                            <FormattedValue
                                type={'subtitle'}
                                value={`${useFormatPrice(bill.value * bill.quantity)}`}
                                size={'small'}
                                align={'right'}
                            />
                            {/* <BillTotal>
                                
                                {` ${useFormatPrice(bill.value * bill.quantity)}`}
                            </BillTotal> */}
                        </BillRow>
                    ))}
                <OpenControllerWithMessage
                    isExpanded={isExpanded}
                    handleExpanded={handleExpanded}
                />
            </Bills>

            <TotalBills>
                <span>
                    <FormattedValue size={'medium'} type={'title'} value={'Total'} />
                </span>
                <span>
                    <FormattedValue
                        size={'small'}
                        align={'right'}
                        type={'title'}

                        value={useFormatNumber(bills.reduce((acc, bill) => acc + Number(bill.quantity), 0))}
                    />
                </span>
                <span>
                    <FormattedValue
                        size={'small'}
                        type={'title'}
                        align={'right'}
                        value={useFormatPrice(Total)}
                    />
                </span>
            </TotalBills>
        </Container>
    )
}

const Container = styled.div`
    box-sizing: border-box;
    display: grid;
    font-family: 'Noto Sans Mono', monospace;
    ${({ width }) => width === 'small' && `
        max-width: 20em;
    `}
    background-color: white;
    border-radius: var(--border-radius);
    border: 1px solid var(--color3);
   
`
const Bills = styled(motion.div)`
 padding: 0.6em;
    display: grid;
    gap: 0.4em ;
    overflow: hidden;
    position: relative;
    
    ${({ columns }) => {
        switch (columns) {
            case 'auto':
                return `
                grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));
            `
            case '1':
                return `
                grid-template-columns: 1fr;
            `
            case '2':
                return `
                grid-template-columns: repeat(2, 1fr);
            `
            default:
                return `
                grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));
            `
        }
    }}
   
    `
const BillRow = styled.div`
    display: grid;
    grid-template-columns: 3em 10em 1fr;
    gap: 0.8em;
    border-radius: var(--border-radius);
    align-items: center;
`
const BillRef = styled.div`
    width: 3.4em;
    text-align: right;

    `
const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6em;
    border-bottom: 1px solid var(--Gray2);
`
const BillTotal = styled.div`
    min-width: 8em;
    text-align: right;
`
const TotalBills = styled.div`
    border-top: 1px solid var(--Gray2);
    padding: 0.4em ;
    display: grid;
    grid-template-columns: 3.6em 10em 1fr;
    gap: 0.8em;
    font-weight: bold;
    position: sticky;
    bottom: 0;
    span{
        :nth-child(2){
            text-align: right;
        }
            :last-child{

            text-align: right;
        }
    }
`
const Group = styled.div`
    display: flex;
    gap: 1em;
    align-items: center;
`