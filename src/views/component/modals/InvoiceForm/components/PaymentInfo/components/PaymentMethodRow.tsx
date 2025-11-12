import { Checkbox, Input, InputNumber } from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { ChangeEvent, FC, useCallback } from 'react'
import styled from 'styled-components'

import type { PaymentMethod } from '../types'
import type { PaymentMethodMeta } from '../utils/paymentMethodMeta'

interface PaymentMethodRowProps {
    method: PaymentMethod
    readOnly: boolean
    meta: PaymentMethodMeta
    disableValueInput?: boolean
    onStatusChange: (status: boolean) => void
    onValueChange: (value: number) => void
    onReferenceChange: (reference: string) => void
}

export const PaymentMethodRow: FC<PaymentMethodRowProps> = ({
    method,
    readOnly,
    meta,
    disableValueInput = false,
    onStatusChange,
    onValueChange,
    onReferenceChange
}) => {
    const handleStatusChange = useCallback((event: CheckboxChangeEvent) => {
        onStatusChange(event.target.checked)
    }, [onStatusChange])

    const handleValueChange = useCallback((value: number | string | null) => {
        if (typeof value === 'number') {
            onValueChange(value)
            return
        }

        const parsed = Number(value ?? 0)
        onValueChange(Number.isFinite(parsed) ? parsed : 0)
    }, [onValueChange])

    const handleReferenceChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        onReferenceChange(event.target.value)
    }, [onReferenceChange])

    const shouldRenderReference = method.reference !== undefined

    return (
        <MethodRow>
            <MethodControls>
                <ControlGroup>
                    <MethodHeader>
                        <Checkbox
                            checked={method.status}
                            onChange={handleStatusChange}
                            disabled={readOnly}
                        />
                        <MethodLabel>     
                            <span>{meta.label}</span>
                        </MethodLabel>
                    </MethodHeader>
                    <InputNumber
                        addonBefore={<AddonIcon>{meta.icon}</AddonIcon>}
                        placeholder='$$$'
                        value={Number(method.value) || 0}
                        disabled={readOnly || !method.status || disableValueInput}
                        min={0}
                        precision={2}
                        step={0.01}
                        onChange={handleValueChange}
                        style={{ width: '100%' }}
                    />
                </ControlGroup>

                {shouldRenderReference && (
                    <ControlGroup>
                        <ControlLabel>Referencia</ControlLabel>
                        <Input
                            placeholder='Referencia'
                            value={method.reference || ''}
                            disabled={readOnly || !method.status}
                            onChange={handleReferenceChange}
                            addonBefore={<AddonIcon>{meta.icon}</AddonIcon>}
                            style={{ width: '100%' }}
                        />
                    </ControlGroup>
                )}
            </MethodControls>
        </MethodRow>
    )
}

const MethodRow = styled.div`
    display: grid;
    gap: 0.75rem;
    border-radius: 10px;
    background: #fff;
`

const MethodControls = styled.div`
    display: grid;
    gap: 0.75rem;
    width: 100%;

    @media (min-width: 768px) {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        align-items: flex-start;
    }
`

const ControlGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    width: 100%;
`

const MethodHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
`

const MethodLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #262626;
`

const AddonIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    color: #434343;
`

const ControlLabel = styled.span`
    font-size: 12px;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 0.03em;
`
