
import React from 'react'
import { Button } from '../../../system/Button/Button'
import { handleImageHidden, handleRowMode, selectCategoryGrouped, selectFullScreen, selectImageHidden, selectIsRow, toggleCategoryGrouped, toggleFullScreen } from '../../../../../features/setting/settingSlice'
import styled from 'styled-components'

import ROUTES_NAME from '../../../../../routes/routesName'
import { icons } from '../../../../../constants/icons/icons'
import { useMatch, useNavigate } from 'react-router-dom'
import { ExpenseChart } from '../../../../pages/Expenses/ExpensesList/components/ExpenseReport/ExpenseReport'
import { toggleExpenseChartModal } from '../../../../../features/expense/expenseUISlice'
import { useDispatch } from 'react-redux'


export const ExpensesListToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const navigate = useNavigate();
    const { EXPENSES_LIST, EXPENSES_CREATE } = ROUTES_NAME.EXPENSES_TERM;
    const matchWithExpenseList = useMatch(EXPENSES_LIST);
    const dispatch = useDispatch();
    const handleGoToCreateExpense = () => navigate(EXPENSES_CREATE);
    const handleOpenExpensesChart = () => {
        dispatch(toggleExpenseChartModal())
    }
    return (
        matchWithExpenseList && (
            <Container>
                {/* {
                    side === 'left' && (
                        <SearchInput
                            search
                            deleteBtn
                            icon={icons.operationModes.search}
                            placeholder='Buscar Categoría...'
                            bgColor={'white'}
                            value={searchData}
                            onClear={() => setSearchData('')}
                            onChange={(e) => setSearchData(e.target.value)}
                        />
                    )
                } */}
                {
                    side === 'right' && (
                        <Group >
                            <Button
                                title='Ver Reporte'
                                onClick={handleOpenExpensesChart}
                                />
                            <Button
                                title='Gasto'
                                startIcon={icons.operationModes.add}
                                onClick={handleGoToCreateExpense}
                            />
                        </Group>
                    )
                }
               
            </Container>
        )
    )
}
const Container = styled.div`

`
const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4em;
 
`