import { getLocalTimeZone, parseTime, today } from '@internationalized/date';
import styled from 'styled-components';

import {
  VmAccordion,
  VmAlert,
  VmAlertDialog,
  VmAutocomplete,
  VmAvatar,
  VmBadge,
  VmBreadcrumbs,
  VmButton,
  VmButtonGroup,
  VmCalendar,
  VmCard,
  VmCheckbox,
  VmCheckboxGroup,
  VmChip,
  VmCloseButton,
  VmColorArea,
  VmColorField,
  VmColorPicker,
  VmColorSlider,
  VmColorSwatch,
  VmColorSwatchPicker,
  VmComboBox,
  VmDateField,
  VmDatePicker,
  VmDateRangePicker,
  VmDescription,
  VmDisclosure,
  VmDisclosureGroup,
  VmDropdown,
  VmErrorMessage,
  VmFieldError,
  VmFieldset,
  VmForm,
  VmInput,
  VmInputGroup,
  VmInputOTP,
  VmKbd,
  VmLabel,
  VmLink,
  VmListBox,
  VmMeter,
  VmNumberField,
  VmPagination,
  VmPopover,
  VmProgressBar,
  VmProgressCircle,
  VmRadio,
  VmRadioGroup,
  VmRangeCalendar,
  VmScrollShadow,
  VmSearchField,
  VmSelect,
  VmSeparator,
  VmSkeleton,
  VmSlider,
  VmSpinner,
  VmSurface,
  VmSwitch,
  VmTable,
  VmTabs,
  VmTag,
  VmTagGroup,
  VmTextArea,
  VmTextField,
  VmTimeField,
  VmToast,
  VmToggleButton,
  VmToggleButtonGroup,
  VmToolbar,
  VmTooltip,
} from '@/components/heroui';
import { InfoCircleOutlined } from '@/constants/icons/antd';

const selectItems = [
  { id: 'sales', label: 'Ventas' },
  { id: 'purchases', label: 'Compras' },
  { id: 'accounting', label: 'Contabilidad' },
];
const colorPresets = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
];
const otpSlotIndexes = Array.from({ length: 6 }, (_, index) => index);
const scrollLineNumbers = Array.from({ length: 8 }, (_, index) => index + 1);

const CustomHeroUiPlayground = () => {
  const currentDate = today(getLocalTimeZone());

  return (
    <Page>
      <PageHeader>
        <HeaderText>
          <Eyebrow>Lab</Eyebrow>
          <Title>Componentes VentaMas</Title>
        </HeaderText>
      </PageHeader>

      <ComponentGrid>
        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmButtonGroup</PanelTitle>
            <PanelMeta>ButtonGroup / ToggleButton / CloseButton</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <InlineStack>
              <VmButtonGroup>
                <VmButton>Dia</VmButton>
                <VmButton>Semana</VmButton>
                <VmButton>Mes</VmButton>
              </VmButtonGroup>

              <VmToggleButtonGroup defaultSelectedKeys={['bold']}>
                <VmToggleButton id="bold">B</VmToggleButton>
                <VmToggleButton id="italic">I</VmToggleButton>
                <VmToggleButton id="underline">U</VmToggleButton>
              </VmToggleButtonGroup>

              <VmCloseButton aria-label="Cerrar preview" />
            </InlineStack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmAvatar</PanelTitle>
            <PanelMeta>Avatar / Badge / Chip / Kbd / Link</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <InlineStack>
              <VmAvatar>
                <VmAvatar.Fallback>VM</VmAvatar.Fallback>
              </VmAvatar>

              <VmBadge color="danger">
                <VmBadge.Anchor>
                  <VmAvatar>
                    <VmAvatar.Fallback>JL</VmAvatar.Fallback>
                  </VmAvatar>
                </VmBadge.Anchor>
                <VmBadge.Label>3</VmBadge.Label>
              </VmBadge>

              <VmChip color="accent" variant="soft">
                <VmChip.Label>Fiscal</VmChip.Label>
              </VmChip>

              <VmKbd>
                <VmKbd.Content>Ctrl</VmKbd.Content>
                <VmKbd.Content>K</VmKbd.Content>
              </VmKbd>

              <VmLink href="/purchases">Ir a compras</VmLink>
            </InlineStack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmForm</PanelTitle>
            <PanelMeta>TextField / TextArea / Fieldset / InputGroup</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmForm className="custom-form-preview">
              <VmTextField name="supplier">
                <VmLabel>Suplidor</VmLabel>
                <VmInput placeholder="Distribuidora Norte" />
                <VmDescription>
                  Campo compuesto original de HeroUI.
                </VmDescription>
              </VmTextField>

              <VmTextField name="notes">
                <VmLabel>Notas</VmLabel>
                <VmTextArea placeholder="Detalle de compra" />
              </VmTextField>

              <VmFieldset className="custom-form-wide">
                <VmFieldset.Legend>Datos fiscales</VmFieldset.Legend>
                <VmFieldset.Group className="custom-form-grid">
                  <VmTextField name="ncf">
                    <VmLabel>NCF</VmLabel>
                    <VmInput placeholder="B0100000129" />
                    <VmFieldError>Campo requerido faltante</VmFieldError>
                  </VmTextField>

                  <VmInputGroup>
                    <VmInputGroup.Prefix>RD$</VmInputGroup.Prefix>
                    <VmInputGroup.Input placeholder="0.00" />
                  </VmInputGroup>
                </VmFieldset.Group>
              </VmFieldset>

              <VmErrorMessage className="custom-form-wide">
                Mensaje de error reusable.
              </VmErrorMessage>
            </VmForm>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmControls</PanelTitle>
            <PanelMeta>Checkbox / RadioGroup / Switch / Slider</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <Stack>
              <VmCheckboxGroup defaultValue={['606']} variant="primary">
                <VmLabel>Reportes</VmLabel>
                <VmCheckbox value="606">
                  <VmCheckbox.Control>
                    <VmCheckbox.Indicator />
                  </VmCheckbox.Control>
                  <VmLabel>606</VmLabel>
                </VmCheckbox>
                <VmCheckbox value="607">
                  <VmCheckbox.Control>
                    <VmCheckbox.Indicator />
                  </VmCheckbox.Control>
                  <VmLabel>607</VmLabel>
                </VmCheckbox>
              </VmCheckboxGroup>

              <VmRadioGroup defaultValue="cash" orientation="horizontal">
                <VmRadio value="cash">
                  <VmRadio.Control>
                    <VmRadio.Indicator />
                  </VmRadio.Control>
                  <VmLabel>Efectivo</VmLabel>
                </VmRadio>
                <VmRadio value="credit">
                  <VmRadio.Control>
                    <VmRadio.Indicator />
                  </VmRadio.Control>
                  <VmLabel>Credito</VmLabel>
                </VmRadio>
              </VmRadioGroup>

              <VmSwitch defaultSelected>Activo</VmSwitch>

              <VmSlider defaultValue={62} className="custom-control-preview">
                <VmLabel>Avance</VmLabel>
                <VmSlider.Output />
                <VmSlider.Track>
                  <VmSlider.Fill />
                  <VmSlider.Thumb />
                </VmSlider.Track>
              </VmSlider>
            </Stack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmAutocomplete</PanelTitle>
            <PanelMeta>Autocomplete / ComboBox / ListBox / TagGroup</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <Stack>
              <VmAutocomplete
                defaultValue="sales"
                className="custom-control-preview"
              >
                <VmLabel>Modulo</VmLabel>
                <VmAutocomplete.Trigger>
                  <VmAutocomplete.Value />
                  <VmAutocomplete.ClearButton />
                  <VmAutocomplete.Indicator />
                </VmAutocomplete.Trigger>
                <VmAutocomplete.Popover>
                  <VmAutocomplete.Filter>
                    <VmSearchField>
                      <VmSearchField.Group>
                        <VmSearchField.SearchIcon />
                        <VmSearchField.Input placeholder="Buscar" />
                      </VmSearchField.Group>
                    </VmSearchField>
                    <VmListBox items={selectItems}>
                      {(item) => (
                        <VmListBox.Item id={item.id} textValue={item.label}>
                          {item.label}
                          <VmListBox.ItemIndicator />
                        </VmListBox.Item>
                      )}
                    </VmListBox>
                  </VmAutocomplete.Filter>
                </VmAutocomplete.Popover>
              </VmAutocomplete>

              <VmComboBox
                defaultSelectedKey="purchases"
                className="custom-control-preview"
              >
                <VmLabel>Modulo</VmLabel>
                <VmComboBox.InputGroup>
                  <VmInput placeholder="Buscar modulo" />
                  <VmComboBox.Trigger />
                </VmComboBox.InputGroup>
                <VmComboBox.Popover>
                  <VmListBox items={selectItems}>
                    {(item) => (
                      <VmListBox.Item id={item.id} textValue={item.label}>
                        {item.label}
                        <VmListBox.ItemIndicator />
                      </VmListBox.Item>
                    )}
                  </VmListBox>
                </VmComboBox.Popover>
              </VmComboBox>

              <VmTagGroup
                aria-label="Etiquetas"
                defaultSelectedKeys={['fiscal']}
              >
                <VmLabel>Etiquetas</VmLabel>
                <VmTagGroup.List>
                  <VmTag id="fiscal" textValue="Fiscal">
                    Fiscal
                    <VmTag.RemoveButton />
                  </VmTag>
                  <VmTag id="cxp" textValue="CxP">
                    CxP
                    <VmTag.RemoveButton />
                  </VmTag>
                </VmTagGroup.List>
              </VmTagGroup>
            </Stack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmColor</PanelTitle>
            <PanelMeta>ColorPicker / ColorField / ColorSlider</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <Stack>
              <VmColorPicker defaultValue="#0485F7">
                <VmColorPicker.Trigger>
                  <VmColorSwatch size="lg" />
                  <VmLabel>ColorPicker</VmLabel>
                </VmColorPicker.Trigger>
                <VmColorPicker.Popover>
                  <VmColorArea
                    aria-label="Color area"
                    colorSpace="hsb"
                    xChannel="saturation"
                    yChannel="brightness"
                  >
                    <VmColorArea.Thumb />
                  </VmColorArea>
                  <VmColorSlider
                    aria-label="Hue"
                    channel="hue"
                    colorSpace="hsb"
                    defaultValue="#3b82f6"
                  >
                    <VmColorSlider.Track>
                      <VmColorSlider.Thumb />
                    </VmColorSlider.Track>
                  </VmColorSlider>
                </VmColorPicker.Popover>
              </VmColorPicker>

              <VmColorField
                defaultValue="#0485F7"
                className="custom-control-preview"
              >
                <VmLabel>Hex</VmLabel>
                <VmColorField.Group fullWidth>
                  <VmColorField.Input />
                </VmColorField.Group>
              </VmColorField>

              <VmColorSwatchPicker defaultValue="#3b82f6" size="sm">
                {colorPresets.map((color) => (
                  <VmColorSwatchPicker.Item key={color} color={color}>
                    <VmColorSwatchPicker.Swatch />
                  </VmColorSwatchPicker.Item>
                ))}
              </VmColorSwatchPicker>
            </Stack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmDateRangePicker</PanelTitle>
            <PanelMeta>Calendar / RangeCalendar / DateRangePicker</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <Stack>
              <VmCalendar
                aria-label="Fecha"
                className="custom-calendar-preview"
              >
                <VmCalendar.Header>
                  <VmCalendar.Heading />
                  <VmCalendar.NavButton slot="previous" />
                  <VmCalendar.NavButton slot="next" />
                </VmCalendar.Header>
                <VmCalendar.Grid>
                  <VmCalendar.GridHeader>
                    {(day) => (
                      <VmCalendar.HeaderCell>{day}</VmCalendar.HeaderCell>
                    )}
                  </VmCalendar.GridHeader>
                  <VmCalendar.GridBody>
                    {(date) => <VmCalendar.Cell date={date} />}
                  </VmCalendar.GridBody>
                </VmCalendar.Grid>
              </VmCalendar>

              <VmDateRangePicker
                defaultValue={{
                  start: currentDate,
                  end: currentDate.add({ days: 5 }),
                }}
                className="custom-control-preview"
              >
                <VmLabel>Rango</VmLabel>
                <VmDateField.Group fullWidth>
                  <VmDateField.InputContainer>
                    <VmDateField.Input slot="start">
                      {(segment) => <VmDateField.Segment segment={segment} />}
                    </VmDateField.Input>
                    <VmDateRangePicker.RangeSeparator />
                    <VmDateField.Input slot="end">
                      {(segment) => <VmDateField.Segment segment={segment} />}
                    </VmDateField.Input>
                  </VmDateField.InputContainer>
                  <VmDateField.Suffix>
                    <VmDateRangePicker.Trigger>
                      <VmDateRangePicker.TriggerIndicator />
                    </VmDateRangePicker.Trigger>
                  </VmDateField.Suffix>
                </VmDateField.Group>
                <VmDateRangePicker.Popover>
                  <VmRangeCalendar aria-label="Rango de fechas">
                    <VmRangeCalendar.Header>
                      <VmRangeCalendar.YearPickerTrigger>
                        <VmRangeCalendar.YearPickerTriggerHeading />
                        <VmRangeCalendar.YearPickerTriggerIndicator />
                      </VmRangeCalendar.YearPickerTrigger>
                      <VmRangeCalendar.NavButton slot="previous" />
                      <VmRangeCalendar.NavButton slot="next" />
                    </VmRangeCalendar.Header>
                    <VmRangeCalendar.Grid>
                      <VmRangeCalendar.GridHeader>
                        {(day) => (
                          <VmRangeCalendar.HeaderCell>
                            {day}
                          </VmRangeCalendar.HeaderCell>
                        )}
                      </VmRangeCalendar.GridHeader>
                      <VmRangeCalendar.GridBody>
                        {(date) => <VmRangeCalendar.Cell date={date} />}
                      </VmRangeCalendar.GridBody>
                    </VmRangeCalendar.Grid>
                  </VmRangeCalendar>
                </VmDateRangePicker.Popover>
              </VmDateRangePicker>
            </Stack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmNavigation</PanelTitle>
            <PanelMeta>
              Accordion / Disclosure / Tabs / Breadcrumbs / Pagination
            </PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <Stack>
              <VmAccordion
                className="custom-wide-preview"
                defaultExpandedKeys={['one']}
              >
                <VmAccordion.Item id="one">
                  <VmAccordion.Heading>
                    <VmAccordion.Trigger>
                      Fiscal
                      <VmAccordion.Indicator />
                    </VmAccordion.Trigger>
                  </VmAccordion.Heading>
                  <VmAccordion.Panel>
                    <VmAccordion.Body>
                      Validaciones 606, NCF y tipo de gasto.
                    </VmAccordion.Body>
                  </VmAccordion.Panel>
                </VmAccordion.Item>
              </VmAccordion>

              <VmDisclosureGroup className="custom-wide-preview">
                <VmDisclosure id="filters">
                  <VmDisclosure.Heading>
                    <VmDisclosure.Trigger>
                      Filtros
                      <VmDisclosure.Indicator />
                    </VmDisclosure.Trigger>
                  </VmDisclosure.Heading>
                  <VmDisclosure.Content>
                    <VmDisclosure.Body>
                      Fecha, suplidor, estado.
                    </VmDisclosure.Body>
                  </VmDisclosure.Content>
                </VmDisclosure>
              </VmDisclosureGroup>

              <VmTabs
                defaultSelectedKey="pendientes"
                className="custom-wide-preview"
              >
                <VmTabs.ListContainer>
                  <VmTabs.List aria-label="Compras">
                    <VmTabs.Tab id="pendientes">Pendientes</VmTabs.Tab>
                    <VmTabs.Tab id="recibidas">Recibidas</VmTabs.Tab>
                  </VmTabs.List>
                </VmTabs.ListContainer>
                <VmTabs.Panel id="pendientes">18 pendientes</VmTabs.Panel>
                <VmTabs.Panel id="recibidas">42 recibidas</VmTabs.Panel>
              </VmTabs>

              <VmBreadcrumbs>
                <VmBreadcrumbs.Item href="/purchases">
                  Compras
                </VmBreadcrumbs.Item>
                <VmBreadcrumbs.Item>Compra #129</VmBreadcrumbs.Item>
              </VmBreadcrumbs>

              <VmPagination>
                <VmPagination.Content>
                  <VmPagination.Previous>Anterior</VmPagination.Previous>
                  <VmPagination.Item>
                    <VmPagination.Link>1</VmPagination.Link>
                  </VmPagination.Item>
                  <VmPagination.Item>
                    <VmPagination.Link>2</VmPagination.Link>
                  </VmPagination.Item>
                  <VmPagination.Next>Siguiente</VmPagination.Next>
                </VmPagination.Content>
              </VmPagination>
            </Stack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmProgress</PanelTitle>
            <PanelMeta>
              Meter / Progress / Spinner / Skeleton / ScrollShadow
            </PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <Stack>
              <VmProgressBar value={68} className="custom-control-preview">
                <VmProgressBar.Output />
                <VmProgressBar.Track>
                  <VmProgressBar.Fill />
                </VmProgressBar.Track>
              </VmProgressBar>

              <VmMeter value={72} className="custom-control-preview">
                <VmMeter.Output />
                <VmMeter.Track>
                  <VmMeter.Fill />
                </VmMeter.Track>
              </VmMeter>

              <InlineStack>
                <VmProgressCircle value={42}>
                  <VmProgressCircle.Track>
                    <VmProgressCircle.TrackCircle />
                    <VmProgressCircle.FillCircle />
                  </VmProgressCircle.Track>
                </VmProgressCircle>
                <VmSpinner />
                <VmSkeleton className="custom-skeleton-preview" />
              </InlineStack>

              <VmScrollShadow className="custom-scroll-preview">
                {scrollLineNumbers.map((lineNumber) => (
                  <p key={`scroll-line-${lineNumber}`}>
                    Linea desplazable {lineNumber}
                  </p>
                ))}
              </VmScrollShadow>
            </Stack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmTable</PanelTitle>
            <PanelMeta>Table / Toolbar / Separator</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <Stack>
              <VmToolbar aria-label="Acciones de tabla">
                <VmButtonGroup>
                  <VmButton size="sm">Exportar</VmButton>
                  <VmButton size="sm">Filtrar</VmButton>
                </VmButtonGroup>
              </VmToolbar>

              <VmSeparator />

              <VmTable variant="primary" className="custom-table-preview">
                <VmTable.ScrollContainer>
                  <VmTable.Content aria-label="Compras de ejemplo">
                    <VmTable.Header>
                      <VmTable.Column isRowHeader>ID</VmTable.Column>
                      <VmTable.Column>Suplidor</VmTable.Column>
                      <VmTable.Column>Monto</VmTable.Column>
                    </VmTable.Header>
                    <VmTable.Body>
                      <VmTable.Row id="129">
                        <VmTable.Cell>#129</VmTable.Cell>
                        <VmTable.Cell>Distribuidora Norte</VmTable.Cell>
                        <VmTable.Cell>RD$ 12,450</VmTable.Cell>
                      </VmTable.Row>
                      <VmTable.Row id="130">
                        <VmTable.Cell>#130</VmTable.Cell>
                        <VmTable.Cell>Oficina Central</VmTable.Cell>
                        <VmTable.Cell>RD$ 8,100</VmTable.Cell>
                      </VmTable.Row>
                    </VmTable.Body>
                  </VmTable.Content>
                </VmTable.ScrollContainer>
              </VmTable>
            </Stack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmOverlays</PanelTitle>
            <PanelMeta>AlertDialog / Popover / Toast</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <InlineStack>
              <VmPopover>
                <VmButton variant="secondary">Popover</VmButton>
                <VmPopover.Content className="custom-popover-preview">
                  <VmPopover.Dialog>
                    <VmPopover.Arrow />
                    <VmPopover.Heading>Detalle rapido</VmPopover.Heading>
                    <PopoverText>Contenido contextual.</PopoverText>
                  </VmPopover.Dialog>
                </VmPopover.Content>
              </VmPopover>

              <VmAlertDialog>
                <VmButton variant="danger">AlertDialog</VmButton>
                <VmAlertDialog.Backdrop>
                  <VmAlertDialog.Container>
                    <VmAlertDialog.Dialog className="custom-dialog-preview">
                      <VmAlertDialog.Header>
                        <VmAlertDialog.Heading>
                          Confirmar accion
                        </VmAlertDialog.Heading>
                      </VmAlertDialog.Header>
                      <VmAlertDialog.Body>
                        Ejemplo de confirmacion critica.
                      </VmAlertDialog.Body>
                      <VmAlertDialog.Footer>
                        <VmButton slot="close" variant="secondary">
                          Cancelar
                        </VmButton>
                        <VmButton slot="close" variant="danger">
                          Confirmar
                        </VmButton>
                      </VmAlertDialog.Footer>
                    </VmAlertDialog.Dialog>
                  </VmAlertDialog.Container>
                </VmAlertDialog.Backdrop>
              </VmAlertDialog>

              <VmToast.Provider>
                <VmButton onPress={() => VmToast.toast('Guardado')}>
                  Toast
                </VmButton>
              </VmToast.Provider>
            </InlineStack>
          </PreviewSurface>
        </ComponentPanel>

        <ComponentPanel>
          <PanelHeader>
            <PanelTitle>VmSelect</PanelTitle>
            <PanelMeta>Select</PanelMeta>
          </PanelHeader>

          <PreviewSurface>
            <VmSelect
              defaultSelectedKey="sales"
              className="custom-select-preview"
            >
              <VmLabel>Modulo</VmLabel>
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <VmListBox items={selectItems}>
                  {(item) => (
                    <VmListBox.Item id={item.id} textValue={item.label}>
                      {item.label}
                      <VmListBox.ItemIndicator />
                    </VmListBox.Item>
                  )}
                </VmListBox>
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
              <VmLabel>Buscar</VmLabel>
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
              <VmLabel>Monto</VmLabel>
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
                  <VmInputOTP.Slot
                    key={`custom-otp-slot-${slotIndex}`}
                    index={slotIndex}
                  />
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
                    <VmLabel>Editar</VmLabel>
                  </VmDropdown.Item>
                  <VmDropdown.Item id="duplicate" textValue="Duplicar">
                    <VmLabel>Duplicar</VmLabel>
                  </VmDropdown.Item>
                  <VmDropdown.Item
                    id="delete"
                    textValue="Eliminar"
                    variant="danger"
                  >
                    <VmLabel>Eliminar</VmLabel>
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
              <SurfaceText>
                Contenedor base para formularios y tablas.
              </SurfaceText>
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
                  Disponible dentro del rango fiscal activo. El proximo
                  comprobante se reserva al confirmar la factura.
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
              defaultValue={currentDate}
              className="custom-control-preview"
            >
              <VmLabel>Fecha</VmLabel>
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
            <VmTimeField
              defaultValue={parseTime('09:30')}
              className="custom-control-preview"
            >
              <VmLabel>Hora</VmLabel>
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
              defaultValue={currentDate}
              className="custom-control-preview"
            >
              <VmLabel>Fecha con calendario</VmLabel>
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
                <VmCalendar aria-label="Fecha con calendario">
                  <VmCalendar.Header>
                    <VmCalendar.Heading />
                    <VmCalendar.NavButton slot="previous" />
                    <VmCalendar.NavButton slot="next" />
                  </VmCalendar.Header>
                  <VmCalendar.Grid>
                    <VmCalendar.GridHeader>
                      {(day) => (
                        <VmCalendar.HeaderCell>{day}</VmCalendar.HeaderCell>
                      )}
                    </VmCalendar.GridHeader>
                    <VmCalendar.GridBody>
                      {(date) => <VmCalendar.Cell date={date} />}
                    </VmCalendar.GridBody>
                  </VmCalendar.Grid>
                </VmCalendar>
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

const PageHeader = styled.header`
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
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
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
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  text-align: end;
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

  .custom-calendar-preview {
    width: fit-content;
    max-width: 100%;
  }

  .custom-form-preview {
    display: grid;
    width: 100%;
    gap: var(--ds-space-4);
  }

  .custom-form-grid {
    display: grid;
    gap: var(--ds-space-3);
  }

  .custom-form-wide,
  .custom-table-preview {
    width: 100%;
  }

  .custom-skeleton-preview {
    width: 160px;
    height: 40px;
    border-radius: var(--ds-radius-md);
  }

  .custom-scroll-preview {
    width: min(100%, 320px);
    height: 120px;
    padding: var(--ds-space-3);
    border: 1px solid var(--ds-color-border-default);
    border-radius: var(--ds-radius-md);
  }

  .custom-scroll-preview p {
    margin: 0 0 var(--ds-space-2);
    font-size: var(--ds-font-size-sm);
  }

  .custom-popover-preview,
  .custom-dialog-preview {
    max-width: 320px;
  }
`;

const Stack = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  justify-items: start;
`;

const InlineStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
`;

const CardMetric = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  line-height: var(--ds-line-height-tight);
`;

const CardFooterText = styled.span`
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
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
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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

const PopoverText = styled.p`
  margin: var(--ds-space-2) 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

export default CustomHeroUiPlayground;
