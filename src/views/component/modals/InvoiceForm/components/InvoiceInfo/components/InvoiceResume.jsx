import {
    faShoppingCart,
    faReceipt,
    faPercentage,
    faShoppingBag,
    faTag,
    faCircleInfo
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as antd from 'antd'
import React from 'react'
import styled from 'styled-components'

import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice'

const { Button, Tooltip } = antd

const PAYMENT_LABEL_TRANSLATIONS = {
    cash: 'Efectivo',
    efectivo: 'Efectivo',
    card: 'Tarjeta',
    tarjeta: 'Tarjeta',
    creditcard: 'Tarjeta',
    debitcard: 'Tarjeta',
    transfer: 'Transferencia',
    transferencia: 'Transferencia',
    transferbank: 'Transferencia',
    banktransfer: 'Transferencia',
    deposit: 'Depósito',
    deposito: 'Depósito',
    cheque: 'Cheque',
    check: 'Cheque'
}

const formatPaymentMethodLabel = rawLabel => {
    if (!rawLabel) return 'Método'
    const normalized = String(rawLabel)
        .toLowerCase()
        .replace(/[\s_-]/g, '')
    return PAYMENT_LABEL_TRANSLATIONS[normalized] ?? rawLabel
}

export const InvoiceResume = ({ invoice, onOpenPaymentInfo, isEditLocked = false }) => {
    const changeAmount = invoice?.change?.value ?? 0
    const totalPurchase = invoice?.totalPurchase?.value ?? 0
    const subtotal = invoice?.totalPurchaseWithoutTaxes?.value ?? 0
    const taxes = invoice?.totalTaxes?.value ?? 0
    const items = invoice?.totalShoppingItems?.value ?? 0
    const discountPercentage = Number(invoice?.discount?.value ?? 0)

    const formattedSubtotal = useFormatPrice(subtotal)
    const formattedTaxes = useFormatPrice(taxes)
    const formattedTotal = useFormatPrice(totalPurchase)
    const formattedItems = Number(items).toLocaleString()

    const changeLabel = changeAmount >= 0 ? 'Cambio' : 'Pendiente'

    const changeHelper = changeAmount >= 0
        ? 'Cambio a devolver al cliente'
        : 'Monto pendiente por cobrar'

    const grossTotal = subtotal + taxes
    const discountDifference = grossTotal - totalPurchase
    const normalizedDiscount = discountDifference > 0 ? Math.round(discountDifference * 100) / 100 : 0

    const discountPercentLabel = discountPercentage.toLocaleString('es-DO', {
        maximumFractionDigits: 2,
        minimumFractionDigits: discountPercentage % 1 === 0 ? 0 : 2
    })
    const discountHelperText =
        discountPercentage > 0
            ? `Ahorro del ${discountPercentLabel}% sobre el total`
            : 'Ajuste aplicado al total'
    const formattedDiscount = normalizedDiscount > 0 ? `-${useFormatPrice(normalizedDiscount)}` : null

    const detailItems = [
        {
            icon: faShoppingBag,
            label: 'Artículos vendidos',
            value: formattedItems,
            helper: 'Cantidad total de artículos'
        },
        {
            icon: faReceipt,
            label: 'Subtotal',
            value: formattedSubtotal,
            helper: 'Antes de impuestos'
        },
        {
            icon: faPercentage,
            label: 'Impuestos',
            value: formattedTaxes,
            helper: 'Impuestos facturados'
        }
    ]

    if (normalizedDiscount > 0) {
        detailItems.push({
            icon: faTag,
            label: 'Descuento aplicado',
            value: formattedDiscount,
            helper: discountHelperText,
            status: 'discount'
        })
    }

    detailItems.push(
        {
            icon: faShoppingCart,
            label: 'Total a cobrar',
            value: formattedTotal,
            helper: 'Monto final con descuentos',
            status: 'primary'
        },

    )

    const paymentMethods = Array.isArray(invoice?.paymentMethod) ? invoice.paymentMethod : []
    const activePaymentMethods = paymentMethods.filter(method => method?.status)

    const paymentBreakdown = activePaymentMethods.map(method => {
        const amount = Number(method?.value) || 0
        const rawLabel = method?.name || method?.method || 'Método'
        const label = formatPaymentMethodLabel(rawLabel)
        const helper = method?.reference ? `Ref: ${method.reference}` : null

        return {
            label,
            helper,
            value: useFormatPrice(amount)
        }
    })

    const balanceSummary = {
        label: changeLabel,
        helper: changeHelper,
        value: useFormatPrice(Math.abs(changeAmount)),
        status: changeAmount >= 0 ? 'returned' : 'pending'
    }

    return (
        <Container>
            <ResumeCard>
                <CardHeader>
                    <HeaderText>
                        <HeaderTitle>Resumen de totales</HeaderTitle>
                    </HeaderText>
                    {onOpenPaymentInfo && (
                        <HeaderActions>
                            <Button
                                type="primary"
                                size="small"
                                onClick={onOpenPaymentInfo}
                                disabled={isEditLocked}
                            >
                                Editar pago
                            </Button>
                        </HeaderActions>
                    )}
                </CardHeader>

                <CardBody>
                    <Section>
                        <SectionHeading>Detalle del cálculo</SectionHeading>
                        <RowList>
                            {detailItems.map(item => (
                                <Row key={item.label}>
                                    <RowMain>
                                        {/* <RowIcon data-status={item.status}>
                                            <FontAwesomeIcon icon={item.icon} />
                                        </RowIcon> */}
                                        <RowText>
                                            <RowLabel $status={item.status} $context="detail">
                                                {item.label}
                                            </RowLabel>
                                            <RowHelper $context="detail">
                                                <Tooltip title={item.helper} placement="top" trigger={['hover', 'click']}>
                                                    <InfoIconButton
                                                        type="button"
                                                        aria-label={`Ver más información sobre ${item.label}`}
                                                    >
                                                        <FontAwesomeIcon icon={faCircleInfo} />
                                                    </InfoIconButton>
                                                </Tooltip>
                                            </RowHelper>
                                        </RowText>
                                    </RowMain>
                                    <RowValue $status={item.status} $context="detail">
                                        {item.value}
                                    </RowValue>
                                </Row>
                            ))}
                        </RowList>
                    </Section>

                    <PaymentSection>
                        <SectionHeading>Métodos de pago</SectionHeading>
                        <RowList>
                            {paymentBreakdown.length > 0 ? (
                                paymentBreakdown.map(item => (
                                    <Row key={item.label}>
                                        <RowMain>
                                            <RowText>
                                                <RowLabel $context="detail">{item.label}</RowLabel>
                                                {item.helper && (
                                                    <RowHelper>
                                                        <Tooltip
                                                            title={item.helper}
                                                            placement="top"
                                                            trigger={['hover', 'click']}
                                                        >
                                                            <InfoIconButton
                                                                type="button"
                                                                aria-label={`Ver información adicional de ${item.label}`}
                                                            >
                                                                <FontAwesomeIcon icon={faCircleInfo} />
                                                            </InfoIconButton>
                                                        </Tooltip>
                                                    </RowHelper>
                                                )}
                                            </RowText>
                                        </RowMain>
                                        <RowValue $context="detail">{item.value}</RowValue>
                                    </Row>
                                ))
                            ) : (
                                <EmptyRow>Sin métodos de pago registrados</EmptyRow>
                            )}
                        </RowList>

                        <BalanceRow>
                            <RowMain>
                                <RowText>
                                    <RowLabel
                                        $context="detail"
                                        $status={balanceSummary.status}
                                    >
                                        {balanceSummary.label}
                                    </RowLabel>
                                    <RowHelper>
                                        <Tooltip
                                            title={balanceSummary.helper}
                                            placement="top"
                                            trigger={['hover', 'click']}
                                        >
                                            <InfoIconButton
                                                type="button"
                                                aria-label="Ver información adicional del balance"
                                            >
                                                <FontAwesomeIcon icon={faCircleInfo} />
                                            </InfoIconButton>
                                        </Tooltip>
                                    </RowHelper>
                                </RowText>
                            </RowMain>
                            <RowValue
                                $context="detail"
                                $status={balanceSummary.status}
                            >
                                {balanceSummary.value}
                            </RowValue>
                        </BalanceRow>
                    </PaymentSection>
                </CardBody>
            </ResumeCard>
        </Container>
    )
}

const Container = styled.div`
    width: 100%;
`

const ResumeCard = styled.div`
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
    background: #ffffff;
`

const CardHeader = styled.div`
  display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #e8e8e8;
`

const HeaderText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`

const HeaderTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #262626;
`

const HeaderActions = styled.div`
    display: flex;
    align-items: center;
`

const CardBody = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 3em;
    padding: 16px 24px 20px;
`

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`

const SectionHeading = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: #5d6d83;
    text-transform: uppercase;
    letter-spacing: 0.4px;
`

const RowList = styled.div`
    display: grid;
    gap: 10px;
`

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
`

const RowMain = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`

const RowText = styled.div`
    display: flex;
    gap: 2px;
`

const RowLabel = styled.div`
    font-size: ${props => {
        if (props.$context === 'detail') {
            if (props.$status === 'primary' || props.$status === 'returned' || props.$status === 'pending') return '14px'
            return '12.5px'
        }
        return '13px'
    }};
    font-weight: ${props => {
        if (props.$context === 'detail') {
            if (props.$status === 'primary' || props.$status === 'returned' || props.$status === 'pending') return 700
            return 500
        }
        return 600
    }};
    color: ${props => {
        // Cambio en verde, Pendiente en rojo
        if (props.$status === 'returned') return '#237804'
        if (props.$status === 'pending') return '#d4380d'
        if (props.$context === 'detail' && props.$status === 'primary') {
            return '#1f2937'
        }
        return '#27364b'
    }};
`

const RowHelper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0;
    color: #8a97ab;
`

const RowValue = styled.div`
    font-size: ${props => {
        if (props.$context === 'detail') {
            if (props.$status === 'primary' || props.$status === 'returned' || props.$status === 'pending') return '18px'
            return '14px'
        }
        return '15px'
    }};
    font-weight: ${props => {
        if (props.$context === 'detail') {
            if (props.$status === 'primary' || props.$status === 'returned' || props.$status === 'pending') return 700
            return 500
        }
        return 600
    }};
    color: ${props => {
        if (props.$status === 'returned') return '#237804'
        if (props.$status === 'balanced') return '#1f2933'
        if (props.$status === 'pending') return '#d4380d'
        if (props.$status === 'primary') return '#27364b'
        if (props.$status === 'discount') return '#d4380d'
        return '#1f2933'
    }};
    text-align: right;
    min-width: 96px;
`

const InfoIconButton = styled.button`
    border: none;
    background: transparent;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 13px;
    color: #8a97ab;
    border-radius: 50%;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover,
    &:focus {
        color: #5d6d83;
    }

    &:focus-visible {
        outline: 2px solid rgba(39, 54, 75, 0.4);
        outline-offset: 2px;
    }
`

const PaymentSection = styled(Section)`
 
`

const BalanceRow = styled(Row)`
  
`

const EmptyRow = styled.div`
    font-size: 12px;
    color: #8a97ab;
    padding-left: 42px;
`
