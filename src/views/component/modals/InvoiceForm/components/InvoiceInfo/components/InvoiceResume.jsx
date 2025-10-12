import * as antd from 'antd'
import React from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
    faMoneyBillWave, 
    faShoppingCart, 
    faReceipt, 
    faPercentage, 
    faShoppingBag 
} from '@fortawesome/free-solid-svg-icons'

import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice'

const { Typography } = antd

export const InvoiceResume = ({ invoice }) => {
    const details = [
        { 
            icon: faMoneyBillWave, 
            label: 'Cambio', 
            value: useFormatPrice(invoice.change.value),
            isChange: true,
            changeValue: invoice.change.value
        },
        { 
            icon: faShoppingCart, 
            label: 'Total de la Compra', 
            value: useFormatPrice(invoice.totalPurchase.value) 
        },
        { 
            icon: faReceipt, 
            label: 'Total sin Impuestos', 
            value: useFormatPrice(invoice.totalPurchaseWithoutTaxes.value) 
        },
        { 
            icon: faPercentage, 
            label: 'Impuestos Totales', 
            value: useFormatPrice(invoice.totalTaxes.value) 
        },
        { 
            icon: faShoppingBag, 
            label: 'Artículos Comprados', 
            value: invoice.totalShoppingItems.value 
        }
    ]

    return (
        <Container>
            <ResumeCard>
                <CardHeader>
                    <HeaderTitle>Detalle de la Factura</HeaderTitle>
                </CardHeader>
                
                <DetailsGrid>
                    {details.map((detail, index) => (
                        <DetailItem key={index}>
                            <DetailIcon>
                                <FontAwesomeIcon icon={detail.icon} />
                            </DetailIcon>
                            <DetailContent>
                                <DetailLabel>{detail.label}</DetailLabel>
                                <DetailValue 
                                    $isChange={detail.isChange}
                                    $changeValue={detail.changeValue}
                                >
                                    {detail.value}
                                </DetailValue>
                            </DetailContent>
                        </DetailItem>
                    ))}
                </DetailsGrid>
            </ResumeCard>
        </Container>
    )
}

const Container = styled.div`
    width: 100%;
`

const ResumeCard = styled.div`
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    margin-bottom: 16px;
`

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #e8e8e8;
`

const HeaderTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #262626;
`

const DetailsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    padding: 12px;
    gap: 8px;
`

const DetailItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
`

const DetailIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    color: #8c8c8c;
    font-size: 14px;
    flex-shrink: 0;
`

const DetailContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
`

const DetailLabel = styled.div`
    font-size: 11px;
    font-weight: 500;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 0.3px;
`

const DetailValue = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: ${props => {
        if (props.$isChange) {
            if (props.$changeValue < 0) return '#ff4d4f';
            if (props.$changeValue === 0) return '#52c41a';
        }
        return '#262626';
    }};
    word-break: break-word;
`
