import React from 'react'
import * as ant from 'antd'
import styled from 'styled-components'
const { Card, Space, InputNumber, Form, Checkbox, Select, Col, Row } = ant
export const warrantyOptions = [
    {
        value: 'days',
        label: 'Días'
    },
    {
        value: 'weeks',
        label: 'Semanas'
    },
    {
        value: 'months',
        label: 'Meses'
    },
    {
        value: 'years',
        label: 'Años'
    }
]
export const WarrantyInfo = () => {
    
    return (
        <Card
            title="Garantía"
            size='small'
        >
            <Form.Item
                name={["warranty", "status"]}
                style={{ marginBottom: 0 }}
                valuePropName="checked"
            >
                <Checkbox
                    placeholder="Garantía"
                    maxLength={60}
                >
                    Aplica garantía
                </Checkbox>
            </Form.Item>
            <Group
            >
                <Form.Item
                    name={["warranty", "quantity"]}
                    style={{marginBottom: 0}}
                >
                    <InputNumber
                        placeholder="Cantidad"
                        style={{
                            width:"100%"
                        }}

                    />
                </Form.Item>
                <Form.Item
                    name={["warranty", "unit"]}
                    style={
                        {
                            marginBottom: 0
                        }
                    }
                >
                    <Select
                        placeholder="Unidad"
                    >
                        {
                            warrantyOptions.map((option, index) => (
                                <Select.Option
                                    key={index}
                                    value={option?.value}
                                >
                                    {option?.label}
                                </Select.Option>
                            ))
                        }
                    </Select>
                </Form.Item>
            </Group>

        </Card>
    )
}

const Group = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4em;
`

// Objeto para mapear las unidades en inglés a español
const unidades = {
    day: 'día',
    days: 'días',
    week: 'semana',
    weeks: 'semanas',
    month: 'mes',
    months: 'meses',
    year: 'año',
    years: 'años'
};

export function convertTimeToSpanish(cantidad, unidad) {
    let resultado = '';

    // Verificamos si la unidad está en el objeto y obtenemos su equivalente en español
    const unidadEnEspañol = unidades[unidad.toLowerCase()];

    if (unidadEnEspañol) {
        resultado = cantidad === 1 ? `1 ${unidadEnEspañol}` : `${cantidad} ${unidadEnEspañol}`;
    } else {
        resultado = 'Unidad no reconocida';
    }

    return resultado;
}
