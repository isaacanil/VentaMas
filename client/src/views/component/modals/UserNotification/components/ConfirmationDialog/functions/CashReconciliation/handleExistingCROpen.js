export const handlerExistingCROpen = (dispatch, resolve) => {
    const isExisting = resolve.isExistingOpenCR
    if (isExisting) {
        dispatch(
            setUserNotification({
                isOpen: true,
                title: 'Reconciliación de efectivo',
                description: 'Ya existe una reconciliación de efectivo abierta, ¿desea continuar?',
                onConfirm: () => {
                    history.push('/cash-reconciliation')
                },
            })
        )
    }
}