import React from 'react'
import styled from 'styled-components'
import { UserSection } from './../../../../resource/UserSection/UserSection'
import { DateSection } from './DateSection'
import { CashReconciliationState } from './CashReconciliationState/CashReconciliationState'
import { ViewInvoice } from '../Body/RightSide/components/ViewInvoive/ViewInvoice'
import { CashCountStateIndicator } from '../../../../resource/CashCountStatusIndicator/CashCountStateIndicator'

export const Header = ({state = 'closed'}) => {
   
    return (
        <Container>
            <Row>
                <Group>
                    <UserSection />
                </Group>
                <Group>
                    {/* <DateSection />   */}
                    <CashCountStateIndicator state={state} ></CashCountStateIndicator>
                    {/* <CashReconciliationState state={state}/> */}
                </Group>
            </Row>
        </Container>
    )
}
const Group = styled.div`
    display: flex;
    align-items: center;
    gap: 1em;
`

const Container = styled.div`
    //height: 4.4em;
    background-color: white;
    padding: 0.4em;
    border-radius: var(--border-radius);
    border: var(--border-primary);
    `
const Row = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    
    
` 