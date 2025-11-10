import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { message, Button, Dropdown } from 'antd'
import { useState } from 'react'
import styled from 'styled-components'

import { icons } from '../../../../../../../constants/icons/icons'
import { createProfessionalReportCallback } from '../../../../../../../hooks/exportToExcel/exportConfig'
import { formatBill } from '../../../../../../../hooks/exportToExcel/formatBill'
import exportToExcel from '../../../../../../../hooks/exportToExcel/useExportToExcel'




export const ExportInvoice = ({ invoices = [] }) => {
    const [isExporting, setIsExporting] = useState(false)
    
    const transformedResumenBillsData = () => invoices.map((invoice) => {
        return formatBill({ data: invoice.data, type: 'Resumen' });
    });

    const transformedDetailedBillsData = () => {
        return formatBill({ data: invoices, type: 'Detailed' });
    };    const handleExportButton = async (type) => {
        if (invoices.length === 0) {
            message.error('No hay Facturas para exportar');
            return
        }
        
        setIsExporting(true);
        
        try {
            // Delay mínimo para mostrar el loading
            const exportPromise = (async () => {
                switch (type) {
                    case 'Resumen': {
                        const resumenCallback = createProfessionalReportCallback(
                            'Resumen', 
                            'REPORTE DE CONCILIACIÓN - RESUMEN'
                        );
                        await exportToExcel(
                            transformedResumenBillsData(), 
                            'Conciliación Resumen', 
                            'conciliacion_resumen.xlsx',
                            resumenCallback
                        );
                        return 'El reporte resumen se ha generado correctamente';
                    }
                    case 'Detailed': {
                        const detailedCallback = createProfessionalReportCallback(
                            'Detailed', 
                            'REPORTE DE CONCILIACIÓN - DETALLE'
                        );
                        await exportToExcel(
                            transformedDetailedBillsData(), 
                            'Conciliación Detalle', 
                            'conciliacion_detalle.xlsx',
                            detailedCallback
                        );
                        return 'El reporte detallado se ha generado correctamente';
                    }
                    default:
                        return 'Exportación completada';
                }
            })();            // Asegurar un delay mínimo de 1 segundo para ver el loading
            const [result] = await Promise.all([
                exportPromise,
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

            message.success(result);
        } catch (error) {
            console.error('Error al exportar:', error);
            message.error('Hubo un problema al generar el archivo Excel. Inténtelo nuevamente.');
        } finally {
            setIsExporting(false);
        }
    };

    const items = [
        {
            key: 'detailed',
            label: 'Exportar Detalle',
            onClick: () => handleExportButton('Detailed'),
            disabled: isExporting
        },
        {
            key: 'resumen',
            label: 'Exportar Resumen',
            onClick: () => handleExportButton('Resumen'),
            disabled: isExporting
        },
    ];

    return (
        <Container>
            <Group>
                <Dropdown menu={{items}} placement="bottomRight" disabled={isExporting}>
                    <Button                        icon={isExporting ? (
                            <SpinningIcon 
                                icon={faSpinner} 
                                style={{ marginRight: 4 }} 
                            />
                        ) : icons.arrows.chevronDown}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Generando...' : 'Exportar'}
                    </Button>
                </Dropdown>
            </Group>
        </Container>
    )
}
const Container = styled.div`
    max-width: 1300px;
    width: 100%;
    height: 3em;
    display: flex;
    align-items: center;
    margin: 0 auto;
    gap: 1em;
    justify-content: space-between;
`
const Group = styled.div`   
    display: flex;
    align-items: center;
    gap: 1em;
`
const SpinningIcon = styled(FontAwesomeIcon)`
    animation: spin 1s linear infinite;
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;