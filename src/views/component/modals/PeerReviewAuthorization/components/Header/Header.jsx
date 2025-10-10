import { Typography } from 'antd'
import React from 'react'

import { Logo } from '../../../../../../assets/logo/Logo'


const { Title, Text } = Typography
export const Header = ({
    description = "Permite a un segundo usuario autorizar la apertura de la caja después de una revisión."
}) => {
    return (
        <div style={{ display: 'grid', gap: '1em', rowGap: '1.4em' }}>
            <div style={{ gridTemplateColumns: 'min-content 1fr', display: 'grid', gap: '1.2em', paddingRight: '0.5em' }}>
                <Logo size='small' />
                <div style={{ width: 'calc(100% - 2.5em)' }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 500 }}>
                        Confirmación de Usuario autorizado
                    </Title>
                </div>
            </div>
            <Text type="secondary" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                {description}
            </Text>
        </div>
    )
}
