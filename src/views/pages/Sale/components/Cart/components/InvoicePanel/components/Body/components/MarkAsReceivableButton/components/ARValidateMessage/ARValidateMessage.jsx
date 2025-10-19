import UnifiedARAlert from "./components/GenericClientAlert"

export const ARValidateMessage = ({
    isGenericClient,
    clientId,
    invoiceId,
    isWithinCreditLimit,
    isWithinInvoiceCount,
    activeAccountsReceivableCount,
    creditLimit,
    currentBalance,
    creditLimitValue,
    hasAccountReceivablePermission,
    isChangeNegative,
    abilitiesLoading,
}) => {
    const isCreditLimitExceeded = (creditLimit?.creditLimit?.status) && !isWithinCreditLimit;
    const isInvoiceLimitExceeded = (creditLimit?.invoice?.status) && !isWithinInvoiceCount;


    return (
        <div>

            <UnifiedARAlert
                isGenericClient={isGenericClient}
                isInvoiceLimitExceeded={isInvoiceLimitExceeded}
                isCreditLimitExceeded={isCreditLimitExceeded}
                activeAccountsReceivableCount={activeAccountsReceivableCount}
                creditLimit={creditLimit}
                clientId={clientId}
                invoiceId={invoiceId}
                hasAccountReceivablePermission={hasAccountReceivablePermission}
                isChangeNegative={isChangeNegative}
                abilitiesLoading={abilitiesLoading}
                currentBalance={currentBalance}
                creditLimitValue={creditLimitValue}
            />
        </div>
    )
}