import React from 'react'
import * as antd from 'antd';
import styled from 'styled-components';
const { Form, Input, Button, } = antd;
export const ClientGeneralInfo = ({form, customerData, }) => {

    return (
        <Form
            form={form}
            layout="vertical"
            name="form_in_modal"
            initialValues={{
                ...customerData,
                modifier: 'public',
            }}
        >
            <Form.Item
                name="name"
                label="Nombre Completo"
                rules={[
                    {
                        required: true,
                        message: 'Por favor ingrese el nombre del cliente',
                    },
                ]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="personalID"
                label="Cédula/RNC"
            >
                <Input />
            </Form.Item>
         <FlexContainer>
            <Form.Item
                name="tel"
                label="Teléfono 1"       
                style={{
                    width: '100%'
                }}
            >
                <Input  />
            </Form.Item>
            <Form.Item
                name="tel2"
                label="Teléfono 2"     
                style={{
                    width: '100%'
                }}  
            >
                <Input />
            </Form.Item>

         </FlexContainer>
         
            <Form.Item
                name="address"
                label="Dirección"
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="sector"
                label="Sector"
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="province"
                label="Provincia"
            >
                <Input />
            </Form.Item>
        </Form>
    )
}

const FlexContainer = styled.div`
    display: flex;
    gap: 1em;
    flex-grow: 1;

`