import { Button, Empty, message, Select, Spin, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { fbRecalculateProductStockTotals } from '@/firebase/inventory/recalculateProductStockTotals';
import {
  setDefaultWarehouse,
  useListenWarehouses,
} from '@/firebase/warehouse/warehouseService';

import StockAlertSettingsSection from './components/StockAlertSettingsSection';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

type WarehouseRecord = ReturnType<typeof useListenWarehouses>['data'][number];

const Page = styled.div`
  display: grid;
  gap: 1.6em;
  padding: 1em;
`;

const Head = styled.div`
  display: grid;
  gap: 0.4em;
`;

const Heading = styled(Title).attrs({ level: 3 })`
  && {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`;

const Description = styled(Paragraph)`
  && {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
    color: rgb(0 0 0 / 65%);
  }
`;

const SectionCard = styled.section`
  display: grid;
  gap: 1.2em;
  padding: 18px;
  background-color: #fdfdfd;
  border: 1px solid #e5e9f2;
  border-radius: 12px;
`;

const SectionHeader = styled.div`
  display: grid;
  gap: 0.4em;
`;

const SectionTitle = styled(Text).attrs({ strong: true })`
  && {
    font-size: 16px;
    color: #1f2933;
  }
`;

const SectionDescription = styled(Paragraph)`
  && {
    margin: 0;
    font-size: 14px;
    color: rgb(31 41 51 / 60%);
  }
`;

const OptionContent = styled.div`
  display: grid;
  gap: 4px;
`;

const SelectorContainer = styled.div`
  display: grid;
  gap: 0.6em;
`;

const StyledSelect = styled(Select)`
  && {
    width: 100%;
  }

  && .ant-select-selector {
    padding: 12px;
    border-color: #e5e9f2;
    border-radius: 10px;
  }

  && .ant-select-selection-item {
    display: grid;
    gap: 2px;
    line-height: 1.3;
  }

  && .ant-select-item-option-content {
    display: grid;
    gap: 4px;
    line-height: 1.35;
  }
`;

const OptionLabel = styled.span`
  font-weight: 600;
  color: #1f2933;
`;

const OptionMeta = styled.span`
  font-size: 13px;
  color: rgb(31 41 51 / 58%);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const ActionHelper = styled(Text)`
  && {
    margin: 0;
    font-size: 14px;
    color: rgb(31 41 51 / 60%);
  }
`;

const InventoryConfig = () => {
  const user = useSelector(selectUser);
  const { data: warehouses = [], loading } = useListenWarehouses();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const sortedWarehouses = useMemo(() => {
    return [...warehouses].sort((a, b) => {
      const nameA = (a?.name || '').toLowerCase();
      const nameB = (b?.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [warehouses]);

  useEffect(() => {
    if (!sortedWarehouses.length) {
      setSelectedWarehouseId(null);
      return;
    }

    const currentDefault = sortedWarehouses.find(
      (warehouse) => warehouse?.defaultWarehouse,
    );
    if (currentDefault) {
      setSelectedWarehouseId(currentDefault.id);
      return;
    }

    setSelectedWarehouseId(sortedWarehouses[0].id);
  }, [sortedWarehouses]);

  const handleChange = async (value) => {
    if (!value || value === selectedWarehouseId) return;

    if (!user?.businessID) {
      messageApi.error('No se pudo actualizar el almacén predeterminado.');
      return;
    }

    setIsUpdating(true);
    try {
      await setDefaultWarehouse(user, value);
      setSelectedWarehouseId(value);
      messageApi.success('Almacén predeterminado actualizado.');
    } catch (error) {
      const errorMessage =
        error?.message || 'Error al actualizar el almacén predeterminado.';
      messageApi.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRecalculateStock = async () => {
    if (!user?.businessID) {
      messageApi.error('No se encontró el negocio del usuario.');
      return;
    }

    setIsReconciling(true);
    try {
      const summary = await fbRecalculateProductStockTotals(user);
      const updatedProducts = Number(summary?.productsUpdated ?? 0);
      if (updatedProducts > 0) {
        messageApi.success(
          `Stock recalculado para ${updatedProducts} producto${updatedProducts === 1 ? '' : 's'}.`,
        );
      } else {
        messageApi.info('No se encontraron productos para actualizar.');
      }
    } catch (error) {
      const errMsg =
        error?.message || 'No se pudo recalcular el stock agregado.';
      messageApi.error(errMsg);
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <Page>
      {contextHolder}
      <Head>
        <Heading>Inventario</Heading>
        <Description>
          Define los parámetros principales que afectan al flujo de inventario
          en todo el negocio.
        </Description>
      </Head>

      <SectionCard
        aria-label="Configuraciones de inventario"
        id="inventory-default-warehouse"
        data-config-section="inventory-default-warehouse"
      >
        <SectionHeader>
          <SectionTitle>Almacén predeterminado</SectionTitle>
          <SectionDescription>
            Selecciona el almacén al que se asignarán por defecto los nuevos
            productos, compras y movimientos.
          </SectionDescription>
        </SectionHeader>

        {loading ? (
          <LoadingContainer>
            <Spin />
          </LoadingContainer>
        ) : sortedWarehouses.length === 0 ? (
          <Empty description="Aún no hay almacenes disponibles." />
        ) : (
          <SelectorContainer>
            <StyledSelect
              value={selectedWarehouseId}
              onChange={handleChange}
              disabled={isUpdating}
              showSearch
              optionFilterProp="data-label"
              optionLabelProp="data-display"
              dropdownMatchSelectWidth={false}
              filterOption={(input, option) => {
                const label = option?.props?.['data-label'] || '';
                return label.toLowerCase().includes(input.toLowerCase());
              }}
              placeholder="Selecciona un almacén"
            >
              {sortedWarehouses.map((warehouse) => {
                const name = warehouse?.name || 'Sin nombre';
                const metaParts = [
                  warehouse?.shortName ? `Alias: ${warehouse.shortName}` : null,
                  warehouse?.location
                    ? `Ubicación: ${warehouse.location}`
                    : null,
                ].filter(Boolean);
                const metaLabel = metaParts.join(' · ');
                const searchLabel = [
                  name,
                  warehouse?.shortName,
                  warehouse?.location,
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <Option
                    key={warehouse.id}
                    value={warehouse.id}
                    data-label={searchLabel}
                    data-display={name}
                    disabled={isUpdating}
                  >
                    <OptionContent>
                      <OptionLabel>{name}</OptionLabel>
                      {metaLabel && <OptionMeta>{metaLabel}</OptionMeta>}
                    </OptionContent>
                  </Option>
                );
              })}
            </StyledSelect>
          </SelectorContainer>
        )}
      </SectionCard>

      <SectionCard
        aria-label="Recalcular stock de productos"
        id="inventory-stock-recalc"
        data-config-section="inventory-stock-recalc"
      >
        <SectionHeader>
          <SectionTitle>Sincronizar stock agregado</SectionTitle>
          <SectionDescription>
            Actualiza el stock mostrado en cada producto sumando las
            existencias activas registradas en el inventario. Úsalo cuando el
            stock que ves en catálogos o reportes no coincide con lo que tienes
            físicamente.
          </SectionDescription>
        </SectionHeader>

        <ActionsRow>
          <Button
            type="primary"
            onClick={handleRecalculateStock}
            loading={isReconciling}
            disabled={isUpdating}
          >
            Recalcular stock agregado
          </Button>
          <ActionHelper>
            El proceso puede tardar unos segundos si tienes muchos productos.
          </ActionHelper>
        </ActionsRow>
      </SectionCard>

      <SectionCard
        aria-label="Reportes de inventario"
        id="inventory-stock-alerts"
        data-config-section="inventory-stock-alerts"
      >
        <SectionHeader>
          <SectionTitle>Reportes de inventario</SectionTitle>
          <SectionDescription>
            Configura reportes por correo: stock (umbrales bajo/crítico) y
            vencimientos (días de antelación), frecuencia y hora de envío.
          </SectionDescription>
        </SectionHeader>

        <StockAlertSettingsSection />
      </SectionCard>
    </Page>
  );
};

export default InventoryConfig;
