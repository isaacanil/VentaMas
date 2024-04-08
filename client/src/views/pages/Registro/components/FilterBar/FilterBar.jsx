import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import useViewportWidth from '../../../../../hooks/windows/useViewportWidth'
import { DatePicker } from '../../../../templates/system/Dates/DatePicker/DatePicker'
import { DateRangeFilter } from '../../../../templates/system/Button/TimeFilterButton/DateRangeFilter'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { calculateInvoicesTotal, countInvoices } from '../../../../../utils/invoice'
import { Button } from '../../../../templates/system/Button/Button'
import * as antd from 'antd'
import { icons } from '../../../../../constants/icons/icons'
import { use } from 'i18next'
const { Select, Form } = antd
export const FilterBar = ({ invoices, datesSelected, setDatesSelected, onReportSaleOpen, processedInvoices, setProcessedInvoices }) => {
    const [sortCriteria, setSortCriteria] = useState('defaultCriteria');
    const [sortDirection, setSortDirection] = useState('asc');

    const toggleSortDirection = () => {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');

    }
    const handleSortChange = (value) => {
        setSortCriteria(value);
    };

    useEffect(() => {
        sortAndSetInvoices();
    }, [sortCriteria, sortDirection]);

    const sortOptions = [
        { value: 'defaultCriteria', label: 'Por defecto' },
        { value: 'data.date.seconds', label: 'Fecha' },
        { value: 'data.numberID', label: 'Numero' },
        { value: 'data.client.name', label: 'Cliente' },
        { value: 'data.totalPurchase.value', label: 'Total' },
        // Añade más opciones según necesites, asegurándote de usar el camino completo para propiedades anidadas.
    ];
    const sortInvoices = (invoices, sortCriteria, sortDirection) => {
        if (sortCriteria === 'defaultCriteria') {
            return invoices;
        }
        return invoices.sort((a, b) => {
            let aValue = sortCriteria.split('.').reduce((o, key) => (o[key] ? o[key] : ''), a);
            let bValue = sortCriteria.split('.').reduce((o, key) => (o[key] ? o[key] : ''), b);

            if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
                // Para números
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                // Para strings
                return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
        });
    };
    const sortAndSetInvoices = () => {
        const sortedInvoices = sortInvoices([...processedInvoices], sortCriteria, sortDirection);
        setProcessedInvoices(sortedInvoices);
    };
    const handleTimeChange = (dates) => {
        setDatesSelected(dates)
    }

    const vw = useViewportWidth()
    return (
        <Container>
            <Row>
                <DatePicker
                    inputMovilWidth
                    setDates={setDatesSelected}
                    dates={datesSelected}
                />
                <DateRangeFilter
                    setDates={handleTimeChange}
                    dates={datesSelected}
                />
            </Row>
            <Buttons>
                <OrderOptions>
                    {
                        vw > 900 && (
                            <Button
                                title={'Gráfico de ventas'}
                                onClick={onReportSaleOpen}
                            />
                        )
                    }
                    <Form.Item
                        label={"Ordenar: "}
                        style={{ marginBottom: 0 }}

                    >
                        <Select
                            defaultValue="defaultCriteria"

                            style={{ width: 120 }}
                            onChange={handleSortChange}
                            options={sortOptions}
                        />

                    </Form.Item>

                    <Button
                        startIcon={sortDirection === 'asc' ? icons.sort.sortAsc : icons.sort.sortDesc}
                        onClick={toggleSortDirection}
                        disabled={sortCriteria === 'defaultCriteria'}
                    />
                </OrderOptions>
                {
                    vw < 900 && (
                        <MoreInfo>
                            <Label>
                                {useFormatPrice(calculateInvoicesTotal(invoices))}
                            </Label>
                            <Label>
                                #{countInvoices(invoices)}
                            </Label>
                        </MoreInfo>
                    )

                }
            </Buttons>
        </Container>
    )
}

const Container = styled.div`
    width: 100%;
    display: flex;
    background-color: var(--White);
    width: 100%;
    display: flex;
    align-items: end;
    border-bottom: 1px solid var(--Gray);
    padding: 0.4em 1em;
    margin: 0 auto;
    gap: 1em;
   
    select{
        padding: 0.1em 0.2em;
    }
    @media (max-width: 900px) {
        gap: 0.8em;
        row-gap: 0.4em;
        display: grid;
    }
`
const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  
  @media (max-width: 900px) {
    gap: 0.2em;
    order: 1;
    justify-content: space-between;

  }
`
const Label = styled.div`
    font-size: 1em;
    font-weight: 550;
    min-height: 2em;
    display: flex;
    align-items: center;
    white-space: nowrap;
    @media (max-width: 800px) {
        font-size: 1em;
    }
`

const Row = styled.div`
    display: grid;
    gap: 1em;
    align-items: end;
    align-content: end;
    grid-template-columns: min-content min-content min-content;
    @media (max-width: 800px) {
        row-gap: 0;
        column-gap: 1em;
    }
`

const OrderOptions = styled.div`
    display: flex;
    gap: 1em;
    align-items: center;
    @media (max-width: 800px) {
        gap: 0.2em;
    }
`

const MoreInfo = styled.div`
    display: flex;
    gap: 1em;
    align-items: center;
    
`