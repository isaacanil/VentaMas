import { useState } from 'react'

import { PillButton } from '../../../../../../../../../component/PillButton/PillButton'
import { CashupInvoicesOverview } from '../../../../../../CashupInvoicesOverview/CashupInvoicesOverview'

export const ViewInvoice = ({ invoices, invoicesCount, loading }) => {
    const [isOpen, setIsOpen] = useState(false)
    const handleOpenInvoiceView = () => setIsOpen(true)
    
    return (
        <>
            <PillButton
                onClick={handleOpenInvoiceView}
                loading={loading}
                badgeCount={invoicesCount}
            >
                Facturas
            </PillButton>
            <CashupInvoicesOverview
                isOpen={isOpen}
                invoices={invoices}
                onClose={() => setIsOpen(false)}
            />
        </>
    )
}