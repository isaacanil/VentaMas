import { Calendar, Label, ListBox, ListBoxItem } from '@heroui/react';
import { getLocalTimeZone, parseTime, today } from '@internationalized/date';
import styled from 'styled-components';

import {
  VmAlert,
  VmCard,
  VmDateField,
  VmDatePicker,
  VmDropdown,
  VmInput,
  VmInputOTP,
  VmNumberField,
  VmSearchField,
  VmSelect,
  VmSurface,
  VmTooltip,
  VmTimeField,
} from '@/components/heroui';
import { InfoCircleOutlined } from '@/constants/icons/antd';

const selectItems = [
  { id: 'sales', label: 'Ventas' },
  { id: 'purchases', label: 'Compras' },
  { id: 'accounting', label: 'Contabilidad' },
];
const otpSlotIndexes = Array.from({ length: 6 }, (_, index) => index);

const CustomHeroUiPlayground = () => {
  return (
    <Page>
      <Header>
        <HeaderText>
          <Eyebrow>Lab</Eyebrow>
          <Title>Componentes VentaMas</Title>
        </HeaderText>
      </Header>

      <ComponentGrid>
        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmSelect</PanelTitle>
            <PanelMeta>Select</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmSelect defaultSelectedKey="sales" className="custom-select-preview">
              <Label>Modulo</Label>
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <ListBox items={selectItems}>
                  {(item) => (
                    <ListBoxItem id={item.id} textValue={item.label}>
                      {item.label}
                      <ListBoxItem.Indicator />
                    </ListBoxItem>
                  )}
                </ListBox>
              </VmSelect.Popover>
            </VmSelect>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmInput</PanelTitle>
            <PanelMeta>Input</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmInput
              aria-label="Nombre de cliente"
              className="custom-control-preview"
              placeholder="Nombre de cliente"
            />
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmSearchField</PanelTitle>
            <PanelMeta>SearchField</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmSearchField className="custom-control-preview">
              <Label>Buscar</Label>
              <VmSearchField.Group>
                <VmSearchField.SearchIcon />
                <VmSearchField.Input placeholder="Factura, suplidor, NCF" />
                <VmSearchField.ClearButton />
              </VmSearchField.Group>
            </VmSearchField>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmNumberField</PanelTitle>
            <PanelMeta>NumberField</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmNumberField
              aria-label="Monto"
              className="custom-control-preview"
              defaultValue={1280}
              minValue={0}
              step={0.01}
            >
              <Label>Monto</Label>
              <VmNumberField.Group>
                <VmNumberField.Input />
              </VmNumberField.Group>
            </VmNumberField>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmInputOTP</PanelTitle>
            <PanelMeta>InputOTP</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmInputOTP maxLength={6}>
              <VmInputOTP.Group>
                {otpSlotIndexes.map((slotIndex) => (
                  <VmInputOTP.Slot key={`custom-otp-slot-${slotIndex}`} index={slotIndex} />
                ))}
              </VmInputOTP.Group>
            </VmInputOTP>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmAlert</PanelTitle>
            <PanelMeta>Alert</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmAlert status="warning" className="custom-wide-preview">
              <VmAlert.Indicator />
              <VmAlert.Content>
                <VmAlert.Title>Inventario bajo</VmAlert.Title>
                <VmAlert.Description>
                  Este aviso usa la base de HeroUI con el borde VentaMas.
                </VmAlert.Description>
              </VmAlert.Content>
            </VmAlert>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmDropdown</PanelTitle>
            <PanelMeta>Dropdown</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmDropdown>
              <VmDropdown.Button>Acciones</VmDropdown.Button>
              <VmDropdown.Popover>
                <VmDropdown.Menu aria-label="Acciones de ejemplo">
                  <VmDropdown.Item id="edit" textValue="Editar">
                    <Label>Editar</Label>
                  </VmDropdown.Item>
                  <VmDropdown.Item id="duplicate" textValue="Duplicar">
                    <Label>Duplicar</Label>
                  </VmDropdown.Item>
                  <VmDropdown.Item id="delete" textValue="Eliminar" variant="danger">
                    <Label>Eliminar</Label>
                  </VmDropdown.Item>
                </VmDropdown.Menu>
              </VmDropdown.Popover>
            </VmDropdown>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmCard</PanelTitle>
            <PanelMeta>Card</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmCard className="custom-wide-preview">
              <VmCard.Header>
                <VmCard.Title>Resumen operativo</VmCard.Title>
                <VmCard.Description>
                  Card base de HeroUI con borde VentaMas y sin sombra.
                </VmCard.Description>
              </VmCard.Header>
              <VmCard.Content>
                <CardMetric>RD$ 42,850.00</CardMetric>
              </VmCard.Content>
              <VmCard.Footer>
                <CardFooterText>Actualizado hoy</CardFooterText>
              </VmCard.Footer>
            </VmCard>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmSurface</PanelTitle>
            <PanelMeta>Surface</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <SurfacePreview>
              <SurfaceTitle>Superficie de edicion</SurfaceTitle>
              <SurfaceText>Contenedor base para formularios y tablas.</SurfaceText>
            </SurfacePreview>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmTooltip</PanelTitle>
            <PanelMeta>Tooltip</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <TooltipPreview>
              <TooltipContext>
                <TooltipLabel>NCF autorizado</TooltipLabel>
                <TooltipValue>B0100000342</TooltipValue>
              </TooltipContext>
              <VmTooltip>
                <TooltipTriggerButton aria-label="Ver detalle del NCF">
                  <InfoCircleOutlined aria-hidden />
                </TooltipTriggerButton>
                <VmTooltip.Content showArrow placement="top">
                  <VmTooltip.Arrow />
                  Disponible dentro del rango fiscal activo. El proximo comprobante se
                  reserva al confirmar la factura.
                </VmTooltip.Content>
              </VmTooltip>
            </TooltipPreview>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmDateField</PanelTitle>
            <PanelMeta>DateField</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmDateField
              defaultValue={today(getLocalTimeZone())}
              className="custom-control-preview"
            >
              <Label>Fecha</Label>
              <VmDateField.Group fullWidth>
                <VmDateField.Input>
                  {(segment) => <VmDateField.Segment segment={segment} />}
                </VmDateField.Input>
              </VmDateField.Group>
            </VmDateField>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmTimeField</PanelTitle>
            <PanelMeta>TimeField</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmTimeField defaultValue={parseTime('09:30')} className="custom-control-preview">
              <Label>Hora</Label>
              <VmTimeField.Group fullWidth>
                <VmTimeField.Input>
                  {(segment) => <VmTimeField.Segment segment={segment} />}
                </VmTimeField.Input>
              </VmTimeField.Group>
            </VmTimeField>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmDatePicker</PanelTitle>
            <PanelMeta>DatePicker</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmDatePicker
              defaultValue={today(getLocalTimeZone())}
              className="custom-control-preview"
            >
              <Label>Fecha con calendario</Label>
              <VmDateField.Group fullWidth>
                <VmDateField.Input>
                  {(segment) => <VmDateField.Segment segment={segment} />}
                </VmDateField.Input>
                <VmDateField.Suffix>
                  <VmDatePicker.Trigger>
                    <VmDatePicker.TriggerIndicator />
                  </VmDatePicker.Trigger>
                </VmDateField.Suffix>
              </VmDateField.Group>
              <VmDatePicker.Popover>
                <Calendar aria-label="Fecha con calendario">
                  <Calendar.Header>
                    <Calendar.Heading />
                    <Calendar.NavButton slot="previous" />
                    <Calendar.NavButton slot="next" />
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>
                      {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => <Calendar.Cell date={date} />}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                </Calendar>
              </VmDatePicker.Popover>
            </VmDatePicker>
          </PreviewSurface>
        </ComponentPanel>
      </ComponentGrid>
    </Page>
  );
};

const Page = styled.main`
  min-height: 100vh;
  padding: var(--ds-space-6);
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-page);
`;

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  max-width: 1120px;
  margin: 0 auto var(--ds-space-5);
`;

const HeaderText = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const Eyebrow = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-muted);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--ds-font-size-2xl);
  line-height: var(--ds-line-height-tight);
`;

const ComponentGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ds-space-4);
  max-width: 1120px;
  margin: 0 auto;
`;

const ComponentPanel = styled.article`
  display: grid;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
`;

const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
`;

const PanelMeta = styled.span`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
`;

const PreviewSurface = styled.div`
  display: grid;
  align-items: center;
  min-height: 160px;
  padding: var(--ds-space-5);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-md);

  .custom-select-preview {
    width: min(100%, 280px);
  }

  .custom-control-preview,
  .custom-wide-preview {
    width: min(100%, 320px);
  }
`;

const CardMetric = styled.strong`
  font-size: var(--ds-font-size-xl);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);
`;

const CardFooterText = styled.span`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
`;

const SurfacePreview = styled(VmSurface)`
  display: grid;
  gap: var(--ds-space-2);
  width: min(100%, 320px);
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-lg);
`;

const SurfaceTitle = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-tight);
`;

const SurfaceText = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const TooltipPreview = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-3);
  width: min(100%, 320px);
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
`;

const TooltipContext = styled.div`
  display: grid;
  min-width: 0;
  gap: var(--ds-space-1);
`;

const TooltipLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const TooltipValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-tight);
`;

const TooltipTriggerButton = styled(VmTooltip.Trigger)`
  display: inline-flex;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-text-secondary);
  cursor: help;
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);

  &:hover {
    color: var(--ds-color-text-primary);
    border-color: var(--ds-color-border-strong);
  }

  &:focus-visible {
    border-color: var(--ds-color-border-focus);
    outline: none;
    box-shadow: 0 0 0 3px rgb(22 119 255 / 24%);
  }
`;

export default CustomHeroUiPlayground;
