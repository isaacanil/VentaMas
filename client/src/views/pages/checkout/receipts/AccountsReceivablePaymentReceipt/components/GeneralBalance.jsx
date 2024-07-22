import React, { useEffect, useState } from 'react'
import { fbGetPendingBalance } from '../../../../../../firebase/accountsReceivable/fbGetPendingBalance';
import styled from 'styled-components';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { Subtitle } from '../../../Style';

export const GeneralBalance = ({data}) => {
    const user = useSelector(selectUser);
    const businessID = user?.businessID
    const clientId = data?.client?.id
    const [pendingBalance, setPendingBalance] = useState(0)
    useEffect(() => {
        const fetchPendingBalance = async () => {
            if (!businessID || !clientId) return
            await fbGetPendingBalance(businessID, clientId, setPendingBalance)
        }
        fetchPendingBalance()
    }, [businessID, clientId])
  return (
    <Container>
       <Subtitle>Balance General</Subtitle>
       <Subtitle>{useFormatPrice(pendingBalance)}</Subtitle>
    </Container>
  )
}

const Container = styled.div`
    width: min-content;
    display: grid;
    width: 100%;
   justify-items: right;
    white-space: nowrap;
`