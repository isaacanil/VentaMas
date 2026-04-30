export type HeroUiCategory =
  | 'Actions'
  | 'Collections'
  | 'Color'
  | 'Date and time'
  | 'Feedback'
  | 'Forms'
  | 'Layout'
  | 'Navigation'
  | 'Overlays'
  | 'Typography'
  | 'Utilities';

export type HeroUiComponentInventoryItem = {
  name: string;
  category: HeroUiCategory;
  hasLiveDemo: boolean;
};

export const heroUiComponents: HeroUiComponentInventoryItem[] = [
  { name: 'Accordion', category: 'Navigation', hasLiveDemo: true },
  { name: 'Alert', category: 'Feedback', hasLiveDemo: true },
  { name: 'AlertDialog', category: 'Overlays', hasLiveDemo: true },
  { name: 'Autocomplete', category: 'Forms', hasLiveDemo: false },
  { name: 'Avatar', category: 'Feedback', hasLiveDemo: true },
  { name: 'Badge', category: 'Feedback', hasLiveDemo: true },
  { name: 'Breadcrumbs', category: 'Navigation', hasLiveDemo: true },
  { name: 'Button', category: 'Actions', hasLiveDemo: true },
  { name: 'ButtonGroup', category: 'Actions', hasLiveDemo: true },
  { name: 'Calendar', category: 'Date and time', hasLiveDemo: true },
  { name: 'CalendarYearPicker', category: 'Date and time', hasLiveDemo: false },
  { name: 'Card', category: 'Layout', hasLiveDemo: true },
  { name: 'Checkbox', category: 'Forms', hasLiveDemo: true },
  { name: 'CheckboxGroup', category: 'Forms', hasLiveDemo: true },
  { name: 'Chip', category: 'Feedback', hasLiveDemo: true },
  { name: 'CloseButton', category: 'Actions', hasLiveDemo: true },
  { name: 'ColorArea', category: 'Color', hasLiveDemo: true },
  { name: 'ColorField', category: 'Color', hasLiveDemo: false },
  { name: 'ColorInputGroup', category: 'Color', hasLiveDemo: false },
  { name: 'ColorPicker', category: 'Color', hasLiveDemo: true },
  { name: 'ColorSlider', category: 'Color', hasLiveDemo: true },
  { name: 'ColorSwatch', category: 'Color', hasLiveDemo: true },
  { name: 'ColorSwatchPicker', category: 'Color', hasLiveDemo: true },
  { name: 'ComboBox', category: 'Forms', hasLiveDemo: false },
  { name: 'DateField', category: 'Date and time', hasLiveDemo: true },
  { name: 'DateInputGroup', category: 'Date and time', hasLiveDemo: false },
  { name: 'DatePicker', category: 'Date and time', hasLiveDemo: true },
  { name: 'DateRangePicker', category: 'Date and time', hasLiveDemo: false },
  { name: 'Description', category: 'Typography', hasLiveDemo: true },
  { name: 'Disclosure', category: 'Navigation', hasLiveDemo: true },
  { name: 'DisclosureGroup', category: 'Navigation', hasLiveDemo: true },
  { name: 'Drawer', category: 'Overlays', hasLiveDemo: true },
  { name: 'Dropdown', category: 'Overlays', hasLiveDemo: true },
  { name: 'EmptyState', category: 'Feedback', hasLiveDemo: true },
  { name: 'ErrorMessage', category: 'Typography', hasLiveDemo: true },
  { name: 'FieldError', category: 'Forms', hasLiveDemo: true },
  { name: 'Fieldset', category: 'Forms', hasLiveDemo: true },
  { name: 'Form', category: 'Forms', hasLiveDemo: true },
  { name: 'Header', category: 'Layout', hasLiveDemo: false },
  { name: 'Input', category: 'Forms', hasLiveDemo: true },
  { name: 'InputGroup', category: 'Forms', hasLiveDemo: true },
  { name: 'InputOTP', category: 'Forms', hasLiveDemo: true },
  { name: 'Kbd', category: 'Typography', hasLiveDemo: true },
  { name: 'Label', category: 'Typography', hasLiveDemo: true },
  { name: 'Link', category: 'Navigation', hasLiveDemo: true },
  { name: 'ListBox', category: 'Collections', hasLiveDemo: true },
  { name: 'ListBoxItem', category: 'Collections', hasLiveDemo: true },
  { name: 'ListBoxSection', category: 'Collections', hasLiveDemo: false },
  { name: 'Menu', category: 'Collections', hasLiveDemo: true },
  { name: 'MenuItem', category: 'Collections', hasLiveDemo: true },
  { name: 'MenuSection', category: 'Collections', hasLiveDemo: false },
  { name: 'Meter', category: 'Feedback', hasLiveDemo: true },
  { name: 'Modal', category: 'Overlays', hasLiveDemo: true },
  { name: 'NumberField', category: 'Forms', hasLiveDemo: true },
  { name: 'Pagination', category: 'Navigation', hasLiveDemo: true },
  { name: 'Popover', category: 'Overlays', hasLiveDemo: true },
  { name: 'ProgressBar', category: 'Feedback', hasLiveDemo: true },
  { name: 'ProgressCircle', category: 'Feedback', hasLiveDemo: true },
  { name: 'Rac', category: 'Utilities', hasLiveDemo: false },
  { name: 'Radio', category: 'Forms', hasLiveDemo: true },
  { name: 'RadioGroup', category: 'Forms', hasLiveDemo: true },
  { name: 'RangeCalendar', category: 'Date and time', hasLiveDemo: false },
  { name: 'ScrollShadow', category: 'Layout', hasLiveDemo: true },
  { name: 'SearchField', category: 'Forms', hasLiveDemo: true },
  { name: 'Select', category: 'Forms', hasLiveDemo: true },
  { name: 'Separator', category: 'Layout', hasLiveDemo: true },
  { name: 'Skeleton', category: 'Feedback', hasLiveDemo: true },
  { name: 'Slider', category: 'Forms', hasLiveDemo: true },
  { name: 'Spinner', category: 'Feedback', hasLiveDemo: true },
  { name: 'Surface', category: 'Layout', hasLiveDemo: true },
  { name: 'Switch', category: 'Forms', hasLiveDemo: true },
  { name: 'SwitchGroup', category: 'Forms', hasLiveDemo: false },
  { name: 'Table', category: 'Collections', hasLiveDemo: true },
  { name: 'Tabs', category: 'Navigation', hasLiveDemo: true },
  { name: 'Tag', category: 'Forms', hasLiveDemo: true },
  { name: 'TagGroup', category: 'Forms', hasLiveDemo: true },
  { name: 'Text', category: 'Typography', hasLiveDemo: true },
  { name: 'TextArea', category: 'Forms', hasLiveDemo: true },
  { name: 'TextField', category: 'Forms', hasLiveDemo: true },
  { name: 'TimeField', category: 'Date and time', hasLiveDemo: true },
  { name: 'Toast', category: 'Feedback', hasLiveDemo: false },
  { name: 'ToggleButton', category: 'Actions', hasLiveDemo: true },
  { name: 'ToggleButtonGroup', category: 'Actions', hasLiveDemo: true },
  { name: 'Toolbar', category: 'Actions', hasLiveDemo: false },
  { name: 'Tooltip', category: 'Overlays', hasLiveDemo: true },
];

export const heroUiCategories: HeroUiCategory[] = [
  'Actions',
  'Forms',
  'Feedback',
  'Navigation',
  'Overlays',
  'Collections',
  'Layout',
  'Color',
  'Date and time',
  'Typography',
  'Utilities',
];

export const heroUiComponentCount = heroUiComponents.length;
export const heroUiLiveDemoCount = heroUiComponents.filter((component) => component.hasLiveDemo).length;
