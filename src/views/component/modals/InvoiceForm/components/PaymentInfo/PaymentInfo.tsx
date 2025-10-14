import { Button } from 'antd'
import { FC } from 'react'
import styled from 'styled-components'

import { DiscountSection } from './components/DiscountSection'
import { PaymentMethodsSection } from './components/PaymentMethodsSection'
import { PaymentSummary } from './components/PaymentSummary'
import { usePaymentInfo } from './hooks/usePaymentInfo'
import { PaymentInfoProps } from './types'

export const PaymentInfo: FC<PaymentInfoProps> = ({
    isEditLocked = false,
    onContinue = null
}) => {
    const {
        paymentMethods,
        readOnly,
        formattedTotalPurchase,
        formattedTotalPayment,
        balance,
        discountType,
        discountValue,
        subtotal,
        handleStatusChange,
        handleValueChange,
        handleReferenceChange,
        handleDiscountTypeChange,
        handleDiscountValueChange
    } = usePaymentInfo({ isEditLocked })

    return (
        <Container>
            <DiscountSection
                discountType={discountType}
                discountValue={discountValue}
                subtotal={subtotal}
                readOnly={readOnly}
                onDiscountTypeChange={handleDiscountTypeChange}
                onDiscountValueChange={handleDiscountValueChange}
            />
            <PaymentCard>
                <CardContent>
                    <PaymentMethodsSection
                        paymentMethods={paymentMethods}
                        readOnly={readOnly}
                        onStatusChange={handleStatusChange}
                        onValueChange={handleValueChange}
                        onReferenceChange={handleReferenceChange}
                    />

                    <PaymentSummary
                        formattedTotalPurchase={formattedTotalPurchase}
                        formattedTotalPayment={formattedTotalPayment}
                        balance={balance}
                    />

                </CardContent>
            </PaymentCard>

            {onContinue && (
                <ContinueButtonContainer>
                    <ContinueButton
                        type='primary'
                        size='large'
                        onClick={onContinue}
                        block
                    >
                        Continuar
                    </ContinueButton>
                </ContinueButtonContainer>
            )}
        </Container>
    )
}

const Container = styled.div`
    width: 100%;
    display: grid;
    gap: 1rem;
`

const PaymentCard = styled.div`
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    margin-bottom: 16px;
`

const CardContent = styled.div`
    padding: 16px;
    display: grid;
    gap: 1.25rem;
`

const ContinueButtonContainer = styled.div`
    display: flex;
    justify-content: center;
`

const ContinueButton = styled(Button)`
    max-width: 360px;
    font-weight: 600;
    letter-spacing: 0.02em;

    && {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        background: linear-gradient(135deg, #1890ff, #13c2c2);
        border: none;
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
        transition: all 0.3s ease;
    }

    &&:hover {
        background: linear-gradient(135deg, #40a9ff, #36cfc9);
        transform: translateY(-1px);
    }
`
