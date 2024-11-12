import React, { Fragment } from 'react'
import { DateTime } from 'luxon';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { InfoItem, Spacing } from '../../Style';
import { useFormatPhoneNumber } from '../../../../../../../../hooks/useFormatPhoneNumber';
import { convertTimeStampToMillis, fromMillisToDateISO } from '../../../../../../../../utils/date/convertTimeStampToDate';
import { selectBusinessData } from '../../../../../../../../features/auth/businessSlice';

export const Header = ({ data, Space }) => {
    let business = useSelector(selectBusinessData) || ""
    const fechaActual = data?.date ? fromMillisToDateISO(convertTimeStampToMillis(data.date), "dd/MM/yyyy HH:mm") : DateTime.now().toFormat('dd/MM/yyyy HH:mm');
    return (
        <Container>
                <Title>{business?.name}</Title>
                <InfoItem align='center' label={business?.address} justifyContent='center' />
                <InfoItem align='center' label={useFormatPhoneNumber(business?.tel)} justifyContent='center' />

                <Spacing size={'large'} />

                <InfoItem label={"Fecha"} value={fechaActual} />
                {data?.NCF && <InfoItem label={"NCF"} value={data?.NCF} />}
                <Spacing />
            {
                data?.client && (
                    <div>
                        <InfoItem label="CLIENTE" value={data?.client?.name?.toUpperCase() || 'CLIENTE GENERICO'} />
                        {
                            data?.client?.personalID && <InfoItem label="CEDULA/RNC" value={data?.client?.personalID} />
                        }
                        {
                            data?.client?.tel && <InfoItem label="TEL" value={useFormatPhoneNumber(data?.client?.tel)} />
                        }
                        {
                            data?.client?.address && <InfoItem label="DIR" value={data?.client?.address} />
                        }
                    </div>
                )
            }
        </Container>
    )
}
const Container = styled.div`
    margin-top: 1em;
    margin-bottom: 0.6em;
`
const Title = styled.p`
    font-size: 16px;
    font-weight: 600;
    padding: 0.2em 0;
    text-align: center;
    margin: 0;
    
`
const Group = styled.div`
    display: flex;
    gap: 12px;
`