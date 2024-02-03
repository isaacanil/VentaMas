import React from 'react'
import * as antd from 'antd'
import styled from 'styled-components'
import { useFbGetClients } from '../../../../../../firebase/client/useFbGetClients'
import { changeClientInvoiceForm } from '../../../../../../features/invoice/invoiceFormSlice'
import { useDispatch } from 'react-redux'
const { Form, Input, Switch, Row, Col, Divider, Descriptions, Select, Collapse } = antd


export const Client = ({ invoice }) => {
    const clientData = invoice?.client
    console.log(invoice)
    const dispatch = useDispatch()
    const { clients } = useFbGetClients();
    console.log(clients)
    const options = clients.map(({ client }) => {
        return {
            label: client.name,
            value: JSON.stringify(client)
        }
    })
    const handleChangeClient = (value) => {
        dispatch(changeClientInvoiceForm({ client: JSON.parse(value) }))
    }
    const clientInfo = [
        {
            key: '1',
            label: 'Detalles del Cliente Selecionado',
            children: (
                <Descriptions
                    layout='vertical'
                    size='small'


                >

                    <Descriptions.Item label="Nombre">
                        {clientData.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Teléfono">
                        {clientData.tel}
                    </Descriptions.Item>

                    <Descriptions.Item label="ID Personal">{clientData.personalID}</Descriptions.Item>
                    <Descriptions.Item label="Dirección">
                        {clientData.address}
                    </Descriptions.Item>
                </Descriptions>
            )
        }
    ]

    console.log(options)
    return (
        <div>
            <Divider style={{ marginTop: 0 }} orientation='left' orientationMargin={false}>Informacion Cliente</Divider>
            <Toolbar
              
            >
                <Form.Item
                    labelAlign='right'
                    tooltip="Selecciona un cliente"
                    hasFeedback={true}
                    label="Cambiar Cliente"

                >
                    <Select
                        showSearch
                        placeholder="Buscar y seleccionar cliente"
                        filterOption={(input, option) =>
                            option.label.toLowerCase().includes(input.toLowerCase())
                        }
                        options={options}
                        style={{ width: 200 }}
                        value={clientData.name}
                        onChange={handleChangeClient}
                    >
                    </Select>
                </Form.Item>
            </Toolbar>

            <Collapse style={{ margin: 0 }} ghost items={clientInfo} />


        </div>
    )
}
const DeliveryContainer = styled.div`
    display: grid;
    gap: 1em;
    grid-template-columns: min-content 150px;

`
const Toolbar = styled.div`
    
`