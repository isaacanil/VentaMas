import {
  Accordion,
  Alert,
  AlertDialog,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Calendar,
  Card,
  Checkbox,
  CheckboxGroup,
  Chip,
  CloseButton,
  ColorArea,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  DateField,
  DatePicker,
  Description,
  Disclosure,
  DisclosureGroup,
  Drawer,
  Dropdown,
  EmptyState,
  ErrorMessage,
  FieldError,
  Fieldset,
  Form,
  Input,
  InputGroup,
  InputOTP,
  Kbd,
  Label,
  Link,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  Meter,
  Modal,
  NumberField,
  Pagination,
  Popover,
  ProgressBar,
  ProgressCircle,
  Radio,
  RadioGroup,
  ScrollShadow,
  SearchField,
  Select,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Surface,
  Switch,
  Table,
  Tabs,
  Tag,
  TagGroup,
  Text,
  TextArea,
  TextField,
  TimeField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@heroui/react';
import { getLocalTimeZone, parseTime, today } from '@internationalized/date';

import CatalogCard from './components/CatalogCard';
import {
  heroUiCategories,
  heroUiComponentCount,
  heroUiComponents,
  heroUiLiveDemoCount,
} from './data/componentInventory';

const buttonVariants = ['primary', 'secondary', 'tertiary', 'outline', 'ghost', 'danger'] as const;
const buttonSizes = ['sm', 'md', 'lg'] as const;
const feedbackStatuses = ['default', 'accent', 'success', 'warning', 'danger'] as const;
const chipVariants = ['primary', 'secondary', 'tertiary', 'soft'] as const;
const colorPresets = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'];

const compactItems = [
  { id: 'compras', label: 'Compras' },
  { id: 'cxp', label: 'CxP' },
  { id: 'fiscal', label: 'Fiscal' },
];

const HeroUiPlayground = () => {
  return (
    <main className="heroui-scope min-h-screen bg-zinc-50 px-6 py-8 text-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">Lab</p>
            <h1 className="text-3xl font-semibold">HeroUI + Tailwind</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Inventario local de HeroUI v3 instalado en VentaMas, con variaciones y demos reales
              donde el API es estable para esta pantalla.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip color="accent" variant="soft">
              <Chip.Label>{heroUiComponentCount} componentes</Chip.Label>
            </Chip>
            <Chip color="success" variant="soft">
              <Chip.Label>{heroUiLiveDemoCount} demos vivos</Chip.Label>
            </Chip>
            <Chip variant="soft">
              <Chip.Label>@heroui/react 3.0.3</Chip.Label>
            </Chip>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card variant="secondary">
            <Card.Header>
              <Card.Description>Total disponible</Card.Description>
              <Card.Title>{heroUiComponentCount}</Card.Title>
            </Card.Header>
          </Card>
          <Card variant="secondary">
            <Card.Header>
              <Card.Description>Categorias</Card.Description>
              <Card.Title>{heroUiCategories.length}</Card.Title>
            </Card.Header>
          </Card>
          <Card variant="secondary">
            <Card.Header>
              <Card.Description>Con demo visual</Card.Description>
              <Card.Title>{heroUiLiveDemoCount}</Card.Title>
            </Card.Header>
          </Card>
        </section>

        <CatalogCard title="Inventario completo" description="Todos los exports de componentes detectados por el script oficial local.">
          {heroUiCategories.map((category) => (
            <div key={category} className="min-w-52 flex-1 rounded-lg border border-zinc-200 p-3">
              <h2 className="text-sm font-semibold">{category}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {heroUiComponents
                  .filter((component) => component.category === category)
                  .map((component) => (
                    <Chip
                      key={component.name}
                      color={component.hasLiveDemo ? 'success' : 'default'}
                      size="sm"
                      variant="soft"
                    >
                      <Chip.Label>{component.name}</Chip.Label>
                    </Chip>
                  ))}
              </div>
            </div>
          ))}
        </CatalogCard>

        <CatalogCard title="Button" description="Variantes semanticas y tamanos base.">
          {buttonVariants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
          {buttonSizes.map((size) => (
            <Button key={size} size={size} variant="secondary">
              size {size}
            </Button>
          ))}
          <Button isIconOnly aria-label="Icon only">
            #
          </Button>
          <Button isDisabled>Disabled</Button>
        </CatalogCard>

        <CatalogCard title="ButtonGroup, ToggleButton, ToggleButtonGroup, CloseButton">
          <ButtonGroup>
            <Button>Dia</Button>
            <Button>Semana</Button>
            <Button>Mes</Button>
          </ButtonGroup>
          <ToggleButtonGroup defaultSelectedKeys={['bold']}>
            <ToggleButton id="bold">B</ToggleButton>
            <ToggleButton id="italic">I</ToggleButton>
            <ToggleButton id="underline">U</ToggleButton>
          </ToggleButtonGroup>
          <CloseButton aria-label="Cerrar" />
        </CatalogCard>

        <CatalogCard title="Alert y Chip" description="Estados y variantes de feedback.">
          {feedbackStatuses.map((status) => (
            <Alert key={status} status={status}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{status}</Alert.Title>
                <Alert.Description>Estado visual de HeroUI.</Alert.Description>
              </Alert.Content>
            </Alert>
          ))}
          {chipVariants.map((variant) => (
            <Chip key={variant} color="accent" variant={variant}>
              <Chip.Label>{variant}</Chip.Label>
            </Chip>
          ))}
        </CatalogCard>

        <CatalogCard title="Card, Surface, Separator, ScrollShadow">
          <Card className="w-72">
            <Card.Header>
              <Card.Title>Compra #129</Card.Title>
              <Card.Description>Proveedor, NCF y estado fiscal.</Card.Description>
            </Card.Header>
            <Card.Content>
              <Text size="sm">RD$ 12,450.00</Text>
            </Card.Content>
            <Card.Footer>
              <Button size="sm" variant="outline">
                Ver detalle
              </Button>
            </Card.Footer>
          </Card>
          <Surface className="w-72 p-4">
            <Text size="sm">Surface para contenedores discretos.</Text>
            <Separator className="my-3" />
            <Text size="sm" variant="muted">
              Separador y texto muted.
            </Text>
          </Surface>
          <ScrollShadow className="h-28 w-72 rounded-lg border border-zinc-200 p-3">
            {Array.from({ length: 8 }, (_, index) => (
              <p key={index} className="text-sm">
                Linea desplazable {index + 1}
              </p>
            ))}
          </ScrollShadow>
        </CatalogCard>

        <CatalogCard title="Avatar, Badge, Kbd, Link, Text">
          <Avatar>
            <Avatar.Fallback>VM</Avatar.Fallback>
          </Avatar>
          <Badge color="danger">
            <Badge.Anchor>
              <Avatar>
                <Avatar.Fallback>JL</Avatar.Fallback>
              </Avatar>
            </Badge.Anchor>
            <Badge.Label>3</Badge.Label>
          </Badge>
          <Kbd>
            <Kbd.Content>Ctrl</Kbd.Content>
            <Kbd.Content>F5</Kbd.Content>
          </Kbd>
          <Link href="/purchases">Ir a compras</Link>
          <Text>Texto normal</Text>
          <Description>Descripcion auxiliar</Description>
          <ErrorMessage>Mensaje de error</ErrorMessage>
        </CatalogCard>

        <CatalogCard title="Form, TextField, Input, TextArea, Fieldset">
          <Form className="grid w-full gap-4 md:grid-cols-2">
            <TextField name="supplier">
              <Label>Suplidor</Label>
              <Input placeholder="Distribuidora Norte" />
              <Description>Campo de texto compuesto.</Description>
            </TextField>
            <TextField name="notes">
              <Label>Notas</Label>
              <TextArea placeholder="Detalle de compra" />
            </TextField>
            <Fieldset className="md:col-span-2">
              <Fieldset.Legend>Datos fiscales</Fieldset.Legend>
              <Fieldset.Group className="grid gap-3 md:grid-cols-2">
                <TextField name="ncf">
                  <Label>NCF</Label>
                  <Input placeholder="B0100000129" />
                  <FieldError>Campo requerido faltante</FieldError>
                </TextField>
                <InputGroup>
                  <InputGroup.Prefix>RD$</InputGroup.Prefix>
                  <InputGroup.Input placeholder="0.00" />
                </InputGroup>
              </Fieldset.Group>
            </Fieldset>
          </Form>
        </CatalogCard>

        <CatalogCard title="Checkbox, RadioGroup, Switch, Slider, NumberField">
          <CheckboxGroup defaultValue={['606']} variant="primary">
            <Label>Reportes</Label>
            <Checkbox value="606">
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label>606</Label>
            </Checkbox>
            <Checkbox value="607">
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label>607</Label>
            </Checkbox>
          </CheckboxGroup>
          <RadioGroup defaultValue="cash" orientation="horizontal">
            <Radio value="cash">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Label>Efectivo</Label>
            </Radio>
            <Radio value="credit">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Label>Credito</Label>
            </Radio>
          </RadioGroup>
          <Switch defaultSelected>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label>Activo</Label>
          </Switch>
          <Slider defaultValue={62} className="w-64">
            <Label>Avance</Label>
            <Slider.Output />
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
          <NumberField defaultValue={12} minValue={0}>
            <Label>Cantidad</Label>
            <NumberField.Group>
              <NumberField.DecrementButton>-</NumberField.DecrementButton>
              <NumberField.Input />
              <NumberField.IncrementButton>+</NumberField.IncrementButton>
            </NumberField.Group>
          </NumberField>
        </CatalogCard>

        <CatalogCard title="SearchField, Select, ListBox, Menu, InputOTP">
          <SearchField>
            <Label>Buscar</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Factura, suplidor, NCF" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Select defaultSelectedKey="compras" className="w-56">
            <Label>Modulo</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox items={compactItems}>
                {(item) => (
                  <ListBoxItem id={item.id} textValue={item.label}>
                    {item.label}
                    <ListBoxItem.Indicator />
                  </ListBoxItem>
                )}
              </ListBox>
            </Select.Popover>
          </Select>
          <ListBox aria-label="Lista" className="w-56">
            {compactItems.map((item) => (
              <ListBoxItem key={item.id} id={item.id} textValue={item.label}>
                {item.label}
                <ListBoxItem.Indicator />
              </ListBoxItem>
            ))}
          </ListBox>
          <Menu aria-label="Menu" className="w-48">
            <MenuItem id="edit">Editar</MenuItem>
            <MenuItem id="duplicate">Duplicar</MenuItem>
            <MenuItem id="delete" variant="danger">
              Eliminar
            </MenuItem>
          </Menu>
          <InputOTP maxLength={6}>
            <InputOTP.Group>
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTP.Slot key={index} index={index} />
              ))}
            </InputOTP.Group>
          </InputOTP>
        </CatalogCard>

        <CatalogCard title="Progress, Meter, Spinner, Skeleton, EmptyState">
          <ProgressBar value={68} className="w-64">
            <ProgressBar.Output />
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <Meter value={72} className="w-64">
            <Meter.Output />
            <Meter.Track>
              <Meter.Fill />
            </Meter.Track>
          </Meter>
          <ProgressCircle value={42}>
            <ProgressCircle.Track>
              <ProgressCircle.TrackCircle />
              <ProgressCircle.FillCircle />
            </ProgressCircle.Track>
          </ProgressCircle>
          <Spinner />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <EmptyState className="w-64 rounded-lg border border-dashed border-zinc-300 p-4">
            Sin resultados
          </EmptyState>
        </CatalogCard>

        <CatalogCard title="Accordion, Disclosure, Tabs, Breadcrumbs, Pagination">
          <Accordion className="w-80" defaultExpandedKeys={['one']}>
            <Accordion.Item id="one">
              <Accordion.Heading>
                <Accordion.Trigger>
                  Fiscal
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>Validaciones 606, NCF y tipo de gasto.</Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          <DisclosureGroup className="w-80">
            <Disclosure id="filters">
              <Disclosure.Heading>
                <Disclosure.Trigger>
                  Filtros
                  <Disclosure.Indicator />
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body>Fecha, suplidor, estado.</Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>
          </DisclosureGroup>
          <Tabs defaultSelectedKey="pendientes" className="w-80">
                        <Tabs.ListContainer>
                          <Tabs.List aria-label="Compras">
                            <Tabs.Tab id="pendientes">Pendientes</Tabs.Tab>
                            <Tabs.Tab id="recibidas">Recibidas</Tabs.Tab>
                          </Tabs.List>
                        </Tabs.ListContainer>
            <Tabs.Panel id="pendientes">18 pendientes</Tabs.Panel>
            <Tabs.Panel id="recibidas">42 recibidas</Tabs.Panel>
          </Tabs>
          <Breadcrumbs>
            <Breadcrumbs.Item href="/purchases">Compras</Breadcrumbs.Item>
            <Breadcrumbs.Item>Compra #129</Breadcrumbs.Item>
          </Breadcrumbs>
          <Pagination>
            <Pagination.Content>
              <Pagination.Previous>Anterior</Pagination.Previous>
              <Pagination.Item>
                <Pagination.Link>1</Pagination.Link>
              </Pagination.Item>
              <Pagination.Item>
                <Pagination.Link>2</Pagination.Link>
              </Pagination.Item>
              <Pagination.Next>Siguiente</Pagination.Next>
            </Pagination.Content>
          </Pagination>
        </CatalogCard>

        <CatalogCard title="Overlay: Modal, Drawer, Popover, Tooltip, Dropdown, AlertDialog">
          <Modal>
            <Button variant="secondary">Modal</Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-[360px]">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Modal HeroUI</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>Contenido enfocado para una accion.</Modal.Body>
                  <Modal.Footer>
                    <Button slot="close">Cerrar</Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
          <Drawer>
            <Button variant="secondary">Drawer</Button>
            <Drawer.Backdrop>
              <Drawer.Content>
                <Drawer.Dialog>
                  <Drawer.Handle />
                  <Drawer.Header>
                    <Drawer.Heading>Drawer</Drawer.Heading>
                  </Drawer.Header>
                  <Drawer.Body>Panel lateral/inferior.</Drawer.Body>
                  <Drawer.Footer>
                    <Button slot="close">Cerrar</Button>
                  </Drawer.Footer>
                </Drawer.Dialog>
              </Drawer.Content>
            </Drawer.Backdrop>
          </Drawer>
          <Popover>
            <Button variant="secondary">Popover</Button>
            <Popover.Content className="max-w-64">
              <Popover.Dialog>
                <Popover.Arrow />
                <Popover.Heading>Detalle rapido</Popover.Heading>
                <p className="mt-2 text-sm text-zinc-600">Contenido contextual.</p>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
          <Tooltip>
            <Button variant="secondary">Tooltip</Button>
            <Tooltip.Content>
              <Tooltip.Arrow />
              Info breve
            </Tooltip.Content>
          </Tooltip>
          <Dropdown>
            <Button variant="secondary">Dropdown</Button>
            <Dropdown.Popover>
              <Dropdown.Menu aria-label="Acciones">
                <Dropdown.Item id="view">Ver</Dropdown.Item>
                <Dropdown.Item id="edit">Editar</Dropdown.Item>
                <Dropdown.Item id="delete">Eliminar</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          <AlertDialog>
            <Button variant="danger-soft">AlertDialog</Button>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog className="sm:max-w-[360px]">
                  <AlertDialog.Header>
                    <AlertDialog.Heading>Confirmar accion</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>Ejemplo de confirmacion critica.</AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="secondary">
                      Cancelar
                    </Button>
                    <Button slot="close" variant="danger">
                      Confirmar
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </CatalogCard>

        <CatalogCard title="Color">
          <ColorPicker defaultValue="#0485F7">
            <ColorPicker.Trigger>
              <ColorSwatch size="lg" />
              <Label>ColorPicker</Label>
            </ColorPicker.Trigger>
            <ColorPicker.Popover>
              <ColorArea
                aria-label="Color area"
                colorSpace="hsb"
                xChannel="saturation"
                yChannel="brightness"
              >
                <ColorArea.Thumb />
              </ColorArea>
              <ColorSlider aria-label="Hue" channel="hue" colorSpace="hsb" defaultValue="#3b82f6">
                <ColorSlider.Track>
                  <ColorSlider.Thumb />
                </ColorSlider.Track>
              </ColorSlider>
            </ColorPicker.Popover>
          </ColorPicker>
          <ColorSwatchPicker defaultValue="#3b82f6" size="sm">
            {colorPresets.map((color) => (
              <ColorSwatchPicker.Item key={color} color={color}>
                <ColorSwatchPicker.Swatch />
              </ColorSwatchPicker.Item>
            ))}
          </ColorSwatchPicker>
          <ColorSlider
            aria-label="Hue standalone"
            channel="hue"
            className="w-64"
            colorSpace="hsb"
            defaultValue="#3b82f6"
          >
            <Label>Hue</Label>
            <ColorSlider.Track>
              <ColorSlider.Thumb />
            </ColorSlider.Track>
          </ColorSlider>
        </CatalogCard>

        <CatalogCard title="Date and time">
          <DateField defaultValue={today(getLocalTimeZone())} className="w-64">
            <Label>DateField</Label>
            <DateField.Group fullWidth>
              <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
            </DateField.Group>
          </DateField>
          <TimeField defaultValue={parseTime('09:30')} className="w-52">
            <Label>TimeField</Label>
            <TimeField.Group fullWidth>
              <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
            </TimeField.Group>
          </TimeField>
          <DatePicker defaultValue={today(getLocalTimeZone())} className="w-64">
            <Label>DatePicker</Label>
            <DateField.Group fullWidth>
              <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
              <DateField.Suffix>
                <DatePicker.Trigger>
                  <DatePicker.TriggerIndicator />
                </DatePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>
            <DatePicker.Popover>
              <Calendar aria-label="Fecha">
                <Calendar.Header>
                  <Calendar.Heading />
                  <Calendar.NavButton slot="previous" />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                </Calendar.Grid>
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>
        </CatalogCard>

        <CatalogCard title="Table">
          <Table variant="primary" className="w-full">
            <Table.ScrollContainer>
              <Table.Content aria-label="Compras de ejemplo">
                <Table.Header>
                  <Table.Column isRowHeader>ID</Table.Column>
                  <Table.Column>Suplidor</Table.Column>
                  <Table.Column>Monto</Table.Column>
                </Table.Header>
                <Table.Body>
                  <Table.Row id="129">
                    <Table.Cell>#129</Table.Cell>
                    <Table.Cell>Distribuidora Norte</Table.Cell>
                    <Table.Cell>RD$ 12,450</Table.Cell>
                  </Table.Row>
                  <Table.Row id="130">
                    <Table.Cell>#130</Table.Cell>
                    <Table.Cell>Oficina Central</Table.Cell>
                    <Table.Cell>RD$ 8,100</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </CatalogCard>

        <CatalogCard title="TagGroup">
          <TagGroup aria-label="Etiquetas" defaultSelectedKeys={['fiscal']}>
            <Label>Etiquetas</Label>
            <TagGroup.List>
              <Tag id="fiscal" textValue="Fiscal">
                Fiscal
                <Tag.RemoveButton />
              </Tag>
              <Tag id="cxp" textValue="CxP">
                CxP
                <Tag.RemoveButton />
              </Tag>
            </TagGroup.List>
          </TagGroup>
        </CatalogCard>
      </div>
    </main>
  );
};

export default HeroUiPlayground;
