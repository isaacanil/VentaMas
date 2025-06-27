import React, { useState } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Tooltip, message, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faListAlt, faTable, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { openCreditNoteModal } from '../../../../../features/creditNote/creditNoteModalSlice'
import { DropdownMenu } from '../../../system/DropdownMenu/DropdowMenu'
import exportToExcel from '../../../../../hooks/exportToExcel/useExportToExcel'
import { formatCreditNote } from '../../../../../hooks/exportToExcel/formatCreditNote'
import { createProfessionalCreditNoteReportCallback } from '../../../../../hooks/exportToExcel/exportConfig'
import { DateTime } from 'luxon'
import { fbGetTaxReceipt } from '../../../../../firebase/taxReceipt/fbGetTaxReceipt'
import { selectTaxReceiptEnabled } from '../../../../../features/taxReceipt/taxReceiptSlice'

export const CreditNoteToolbar = ({ side = 'left', searchData, setSearchData, data }) => {
    const matchWithCreditNote = useMatch("/credit-note")
    const dispatch = useDispatch()
    const [isExporting, setIsExporting] = useState(false)
    const [showConfigModal, setShowConfigModal] = useState(false)
    const navigate = useNavigate()
    const { taxReceipt } = fbGetTaxReceipt()
    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled)

    const creditNotes = data || []
    const currentDate = DateTime.now().toFormat('ddMMyyyy')

    const creditNoteReceipt = taxReceipt?.find(receipt =>
        receipt.data?.name?.toLowerCase().includes('nota') &&
        receipt.data?.name?.toLowerCase().includes('crédito') ||
        receipt.data?.serie === '04'
    )

    const isCreditNoteReceiptConfigured = Boolean(creditNoteReceipt && !creditNoteReceipt.data?.disabled)

    // Mostrar botones solo si los comprobantes están habilitados Y el de serie 04 está configurado
    const showCreditNoteActions = taxReceiptEnabled && isCreditNoteReceiptConfigured

    const handleCreateNew = () => {
        if (!taxReceiptEnabled || !isCreditNoteReceiptConfigured) {
            setShowConfigModal(true)
            return
        }
        dispatch(openCreditNoteModal({ mode: 'create' }))
    }

    const transformedResumenCreditNotesData = () => {
        return formatCreditNote({ data: creditNotes, type: 'Resumen' })
    }

    const transformedDetailedCreditNotesData = () => {
        return formatCreditNote({ data: creditNotes, type: 'Detailed' })
    }

    const handleExportButton = async (type) => {
        if (creditNotes.length === 0) {
            message.error('No hay Notas de Crédito para exportar')
            return
        }

        setIsExporting(true)

        try {
            // Delay mínimo para mostrar el loading
            const exportPromise = (async () => {
                switch (type) {
                    case 'Resumen':
                        const resumenCallback = createProfessionalCreditNoteReportCallback(
                            'Resumen',
                            'REPORTE DE NOTAS DE CRÉDITO - RESUMEN'
                        )
                        await exportToExcel(
                            transformedResumenCreditNotesData(),
                            'Resumen de Notas de Crédito',
                            `resumen_notas_credito_${currentDate}.xlsx`,
                            resumenCallback
                        )
                        return 'El reporte resumen de notas de crédito se ha generado correctamente'
                    case 'Detailed':
                        const detailedCallback = createProfessionalCreditNoteReportCallback(
                            'Detailed',
                            'REPORTE DE NOTAS DE CRÉDITO - DETALLE POR PRODUCTO'
                        )
                        await exportToExcel(
                            transformedDetailedCreditNotesData(),
                            'Detalle de Notas de Crédito',
                            `detalle_notas_credito_${currentDate}.xlsx`,
                            detailedCallback
                        )
                        return 'El reporte detallado de notas de crédito se ha generado correctamente'
                    default:
                        return 'Exportación completada'
                }
            })()

            // Asegurar un delay mínimo de 1 segundo para ver el loading
            const [result] = await Promise.all([
                exportPromise,
                new Promise(resolve => setTimeout(resolve, 1000))
            ])

            message.success(result)
        } catch (error) {
            console.error('Error al exportar notas de crédito:', error)
            message.error('Hubo un problema al generar el archivo Excel. Inténtelo nuevamente.')
        } finally {
            setIsExporting(false)
        }
    }

    const exportOptions = [
        {
            text: isExporting ? 'Generando resumen...' : 'Resumen de Notas de Crédito',
            description: 'Obtén un resumen consolidado que incluye información general del cliente, totales y estados.',
            icon: isExporting ? (
                <SpinningIcon icon={faSpinner} />
            ) : (
                <FontAwesomeIcon icon={faListAlt} />
            ),
            action: () => handleExportButton('Resumen'),
            disabled: isExporting
        },
        {
            text: isExporting ? 'Generando detalle...' : 'Detalle de Notas de Crédito',
            description: 'Accede a un desglose detallado con información de cada producto en las notas de crédito.',
            icon: isExporting ? (
                <SpinningIcon icon={faSpinner} />
            ) : (
                <FontAwesomeIcon icon={faTable} />
            ),
            action: () => handleExportButton('Detailed'),
            disabled: isExporting
        },
    ]

    return (
        matchWithCreditNote ? (
            <>
                <Container>
                    {side === 'right' && (
                        <>
                            {showCreditNoteActions && (
                                <DropdownMenu
                                    title='Exportar Excel'
                                    options={exportOptions}
                                />
                            )}
                            {showCreditNoteActions && (
                                <Button
                                onClick={handleCreateNew}
                                icon={<PlusOutlined />}
                                style={{ marginLeft: '8px' }}
                            >
                                Nota de Crédito
                            </Button>
                        )}
                        </>
                    )}
                </Container>

                <Modal
                    open={showConfigModal}
                    onCancel={() => setShowConfigModal(false)}
                    onOk={() => {
                        setShowConfigModal(false)
                        navigate('/settings/general-config-tax-receipt')
                    }}
                    okText="Configurar ahora"
                    cancelText="Cerrar"
                    title="Configuración requerida"
                >
                    {!taxReceiptEnabled ? (
                        <>
                            Los comprobantes fiscales están deshabilitados en la configuración. 
                            Para crear notas de crédito necesitas habilitar los comprobantes fiscales 
                            y configurar el comprobante correspondiente (serie 04).
                        </>
                    ) : (
                        <>
                            Para crear notas de crédito necesitas configurar el comprobante fiscal 
                            correspondiente (serie 04).
                        </>
                    )}
                </Modal>
            </>
        ) : null
    )
}

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`

const SpinningIcon = styled(FontAwesomeIcon)`
    animation: spin 1s linear infinite;
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
` 