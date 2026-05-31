import { Button, Empty, message, Select, Spin } from 'antd';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  recalculateInventoryStock,
  saveDefaultWarehouse,
} from './InventoryConfig.actions';
import {
  buildWarehouseMetaLabel,
  buildWarehouseSearchLabel,
} from './InventoryConfig.helpers';
import {
  ActionHelper,
  ActionsRow,
  Description,
  Head,
  Heading,
  LoadingContainer,
  OptionContent,
  OptionLabel,
  OptionMeta,
  Page,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  SelectorContainer,
  StyledSelect,
} from './InventoryConfig.styles';

import { selectUser } from '@/features/auth/userSlice';
import { useListenWarehouses } from '@/firebase/warehouse/warehouseService';

import StockAlertSettingsSection from './components/StockAlertSettingsSection';

const { Option } = Select;

type WarehouseRecord = ReturnType<typeof useListenWarehouses>['data'][number];

const InventoryConfig = () => {
  const user = useSelector(selectUser);
  const { data: warehouses = [], loading } = useListenWarehouses();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const sortedWarehouses = useMemo<WarehouseRecord[]>(() => {
    return [...warehouses].sort((a, b) => {
      const nameA = (a?.name || '').toLowerCase();
      const nameB = (b?.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [warehouses]);

  const defaultWarehouseId = useMemo<string | null>(() => {
    if (!sortedWarehouses.length) {
      return null;
    }

    const currentDefault = sortedWarehouses.find(
      (warehouse) => warehouse?.defaultWarehouse,
    );
    return currentDefault?.id ?? sortedWarehouses[0].id;
  }, [sortedWarehouses]);
  const selectedWarehouseId = defaultWarehouseId;

  const handleChange = async (value: string) => {
    if (!value || value === selectedWarehouseId) return;

    if (!user?.businessID) {
      messageApi.error('No se pudo actualizar el almacen predeterminado.');
      return;
    }

    setIsUpdating(true);
    const result = await saveDefaultWarehouse({
      user,
      warehouseId: value,
    });
    setIsUpdating(false);

    if (result.status === 'success') {
      messageApi.success('Almacen predeterminado actualizado.');
      return;
    }

    messageApi.error(result.errorMessage);
  };

  const handleRecalculateStock = async () => {
    if (!user?.businessID) {
      messageApi.error('No se encontro el negocio del usuario.');
      return;
    }

    setIsReconciling(true);
    const result = await recalculateInventoryStock({ user });
    setIsReconciling(false);

    if (result.status === 'error') {
      messageApi.error(result.errorMessage);
      return;
    }

    const updatedProducts = Number(result.updatedProducts ?? 0);
    if (updatedProducts > 0) {
      messageApi.success(
        `Stock recalculado para ${updatedProducts} producto${updatedProducts === 1 ? '' : 's'}.`,
      );
      return;
    }

    messageApi.info('No se encontraron productos para actualizar.');
  };

  return (
    <Page>
      {contextHolder}
      <Head>
        <Heading>Inventario</Heading>
        <Description>
          Define los parametros principales que afectan al flujo de inventario
          en todo el negocio.
        </Description>
      </Head>

      <SectionCard
        aria-label="Configuraciones de inventario"
        id="inventory-default-warehouse"
        data-config-section="inventory-default-warehouse"
      >
        <SectionHeader>
          <SectionTitle>Almacen predeterminado</SectionTitle>
          <SectionDescription>
            Selecciona el almacen al que se asignaran por defecto los nuevos
            productos, compras y movimientos.
          </SectionDescription>
        </SectionHeader>

        {loading ? (
          <LoadingContainer>
            <Spin />
          </LoadingContainer>
        ) : sortedWarehouses.length === 0 ? (
          <Empty description="Aun no hay almacenes disponibles." />
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
                const label =
                  (option as { props?: { 'data-label'?: string } } | undefined)
                    ?.props?.['data-label'] || '';
                return label.toLowerCase().includes(input.toLowerCase());
              }}
              placeholder="Selecciona un almacen"
            >
              {sortedWarehouses.map((warehouse) => {
                if (!warehouse?.id) {
                  return null;
                }
                const name = warehouse?.name || 'Sin nombre';
                const metaLabel = buildWarehouseMetaLabel(warehouse);
                const searchLabel = buildWarehouseSearchLabel({
                  name,
                  shortName: warehouse?.shortName,
                  location: warehouse?.location,
                });

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
            Actualiza el stock mostrado en cada producto sumando las existencias
            activas registradas en el inventario. Usalo cuando el stock que ves
            en catalogos o reportes no coincide con lo que tienes fisicamente.
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
            Configura reportes por correo: stock (umbrales bajo/critico) y
            vencimientos (dias de antelacion), frecuencia y hora de envio.
          </SectionDescription>
        </SectionHeader>

        <StockAlertSettingsSection />
      </SectionCard>
    </Page>
  );
};

export default InventoryConfig;
