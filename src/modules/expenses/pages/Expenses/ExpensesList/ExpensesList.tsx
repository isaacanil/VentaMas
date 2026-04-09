import { useState } from 'react';
import styled from 'styled-components';

import ExpensesForm from '@/modules/expenses/pages/Expenses/ExpensesForm/ExpensesForm';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { ExpensesTable } from './components/ExpenseTable/ExpensesTable';

export const ExpensesList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Container>
      <MenuApp
        sectionName={'Gastos'}
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <ExpensesTable searchTerm={searchTerm} />
      <ExpensesForm />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;
