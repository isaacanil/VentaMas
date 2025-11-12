import styled from 'styled-components';

import { MenuApp } from '../../../templates/MenuApp/MenuApp';
import ExpensesForm from '../../Expenses/ExpensesForm/ExpensesForm';

import { ExpensesTable } from './components/ExpenseTable/ExpensesTable';

export const ExpensesList = () => {
  return (
    <Container>
      <MenuApp sectionName={'Gastos'} />
      <ExpensesTable />
      <ExpensesForm />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  height: 100%;
`;
