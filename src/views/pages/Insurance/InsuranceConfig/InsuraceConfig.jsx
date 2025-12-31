import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { openInsuranceConfigModal } from '@/features/insurance/insuranceConfigModalSlice';
import { useListenInsuranceConfig } from '@/firebase/insurance/insuranceService';
import DateUtils from '@/utils/date/dateUtils';
import InsuranceConfigForm from '@/views/pages/Insurance/InsuranceConfigForm/InsuranceConfigForm';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';
import { AdvancedTable } from '@/views/templates/system/AdvancedTable/AdvancedTable';

import { InsuranceTypesDisplay } from './components/InsuranceTypesDisplay';

const InsuranceConfig = () => {
  const dispatch = useDispatch();
  const searchTerm = '';
  const { data: insuranceConfig } = useListenInsuranceConfig();

  // Definición de columnas para la tabla
  const columns = [
    {
      accessor: 'insuranceName',
      Header: 'Nombre del Seguro',
      align: 'left',
      maxWidth: '1.4fr',
      minWidth: '150px',
    },
    {
      accessor: 'insuranceCompanyName',
      Header: 'Nombre de la Empresa',
      align: 'left',
      maxWidth: '1.4fr',
      minWidth: '180px',
    },
    {
      accessor: 'insuranceCompanyRNC',
      Header: 'RNC',
      align: 'left',
      maxWidth: '1.4fr',
      minWidth: '150px',
    },
    {
      accessor: 'insuranceTypes',
      Header: 'Tipos de Planes',
      align: 'left',
      maxWidth: '1.4fr',
      minWidth: '250px',
      cell: ({ value }) => <InsuranceTypesDisplay types={value || []} />,
    },
    {
      accessor: 'createdAt',
      Header: 'Fecha de Creación',
      align: 'left',
      maxWidth: '1.4fr',
      minWidth: '150px',
    },
  ];

  const data = (insuranceConfig || []).map((insurance) => ({
    insuranceName: insurance.insuranceName,
    insuranceCompanyName: insurance.insuranceCompanyName,
    insuranceCompanyRNC: insurance.insuranceCompanyRNC,
    insuranceTypes: Array.isArray(insurance.insuranceTypes)
      ? insurance.insuranceTypes
      : [],
    createdAt: DateUtils.convertMillisToFriendlyDate(
      DateUtils.convertTimestampToMillis(insurance.createdAt),
    ),
    data: insurance,
  }));

  const handleRowClick = (record) => {
    dispatch(openInsuranceConfigModal(record.data));
  };

  return (
    <Container>
      <MenuApp
        sectionName="Configuración de Seguros"
        sectionNameIcon={icons.insurance.insurance}
        displayName="seguros"
      />
      <Content>
        <AdvancedTable
          columns={columns}
          data={data}
          searchTerm={searchTerm}
          onRowClick={handleRowClick}
          elementName="seguros"
          emptyText="No hay configuraciones de seguro"
          numberOfElementsPerPage={10}
        />
      </Content>
      <InsuranceConfigForm />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1em;
`;

export default InsuranceConfig;
