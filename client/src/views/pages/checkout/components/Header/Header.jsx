import React, { Fragment } from 'react'
import { useFormatPhoneNumber } from '../../../../../hooks/useFormatPhoneNumber'
import { DateTime } from 'luxon';
import styled from 'styled-components';

export const Header = ({ business, data, SubTitle, P, Space }) => {
    const fechaActual = DateTime.now().toFormat('dd/MM/yyyy HH:mm');
    return (
        <Container>
            <div>
                <Title>{business?.name}</Title>
                
                <P align="center">{business?.address}</P>
                <P align="center">{useFormatPhoneNumber(business?.tel)}</P>
                <Space size={'large'}  />
                <P><Group>Fecha:  <span>{fechaActual}</span></Group></P>
                <P><Group> NCF: <span> {data.NCF} </span></Group></P>
                <Space />
            </div>

            {
                data.client ? (
                    <div>

                        <P><Group>CLIENTE:<span style={{ "textTransform": "uppercase" }}>{data.client.name ? data.client.name : 'CLIENTE GENERICO'}</span></Group></P>
                        {
                            data.client.tel ? <P><Group>  TEL:<span>{useFormatPhoneNumber(data.client.tel)}</span> </Group></P> : null
                        }
                        {
                            data.client.personalID ? <P><Group>CEDULA/RNC: <span>{data.client.personalID}</span> </Group> </P> : null
                        }
                        {
                            data.client.address ? <P><Group>DIR: <span>{data.client.address}</span></Group></P> : null
                        }
                    </div>
                ) : null
            }
        </Container>
    )
}
const Container = styled.div`
    margin-top: 1em;
    margin-bottom: 0.6em;
`
const Title = styled.p`
    font-size: 18px;
    font-weight: 600;
    padding: 0.2em 0;
    text-align: center;
    margin: 0;
    
`
const Group = styled.div`
    display: flex;
    gap: 12px;
`