import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { openInsuranceConfigModal } from '@/features/insurance/insuranceConfigModalSlice';
import {
  useListenInsuranceConfig,
  type InsuranceConfigData,
} from '@/firebase/insurance/insuranceService';
import { formatDateTime } from '@/utils/date/dateUtils';
import InsuranceConfigForm from '@/modules/insurance/pages/Insurance/InsuranceConfigForm/InsuranceConfigForm';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';

import { InsuranceTypesDisplay } from './components/InsuranceTypesDisplay';

import type { ColumnConfig } from '@/components/ui/AdvancedTable/types/ColumnTypes';

interface InsuranceTableRow {
  insuranceName?: string;
  insuranceCompanyName?: string;
  insuranceCompanyRNC?: string;
  insuranceTypes?: unknown[];
  createdAt?: string;
  data: InsuranceConfigData;
}

const InsuranceConfig = () => {
  const dispatch = useDispatch();
  const searchTerm = '';
  const { data: insuranceConfig } = useListenInsuranceConfig();

  // Definición de columnas para la tabla
  const columns: ColumnConfig<InsuranceTableRow>[] = [
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
      cell: ({ value }) => (
        <InsuranceTypesDisplay
          types={Array.isArray(value) ? value : []}
        />
      ),
    },
    {
      accessor: 'createdAt',
      Header: 'Fecha de Creación',
      align: 'left',
      maxWidth: '1.4fr',
      minWidth: '150px',
    },
  ];

  const data: InsuranceTableRow[] = (insuranceConfig || []).map((insurance) => {
    const record = insurance as Record<string, unknown>;
    return {
      insuranceName:
        typeof record.insuranceName === 'string'
          ? record.insuranceName
          : undefined,
      insuranceCompanyName:
        typeof record.insuranceCompanyName === 'string'
          ? record.insuranceCompanyName
          : undefined,
      insuranceCompanyRNC:
        typeof record.insuranceCompanyRNC === 'string'
          ? record.insuranceCompanyRNC
          : undefined,
      insuranceTypes: Array.isArray(record.insuranceTypes)
        ? (record.insuranceTypes as unknown[])
        : [],
      createdAt: formatDateTime(record.createdAt),
      data: insurance,
    };
  });

  const handleRowClick = (record: InsuranceTableRow) => {
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

