import {
  faCheckCircle,
  faClock,
  faBan,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { Selector } from '@/components/common/Selector/Selector';
import type { StatusOption } from '../types';

const defaultStatusOptions: StatusOption[] = [
  {
    value: 'completed',
    label: 'Completado',
    icon: faCheckCircle,
    color: '#52c41a',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  {
    value: 'pending',
    label: 'Pendiente',
    icon: faClock,
    color: '#faad14',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
  },
  {
    value: 'canceled',
    label: 'Cancelado',
    icon: faBan,
    color: '#ff4d4f',
    bgColor: '#fff1f0',
    borderColor: '#ffccc7',
  },
  {
    value: 'processing',
    label: 'En Proceso',
    icon: faSpinner,
    color: '#1890ff',
    bgColor: '#e6f7ff',
    borderColor: '#91d5ff',
  },
];

interface StatusSelectorProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  statusOptions?: StatusOption[];
  visibleStatus?: string[];
  placeholder?: string;
  width?: string | number;
  clearText?: string;
  allowClear?: boolean;
}

const EMPTY_VISIBLE_STATUS: string[] = [];

export const StatusSelector = ({
  value,
  onChange,
  statusOptions = defaultStatusOptions,
  visibleStatus = EMPTY_VISIBLE_STATUS,
  placeholder = 'Estado',
  width,
  clearText,
  allowClear = true,
}: StatusSelectorProps) => {
  const filteredOptions =
    visibleStatus.length > 0
      ? statusOptions.filter((status) => visibleStatus.includes(status.value))
      : statusOptions;

  const defaultStyles = {
    color: '#666',
    bgColor: '#ffffff',
    borderColor: '#d9d9d9',
    icon: faClock,
  };

  return (
    <Selector
      value={value}
      onChange={onChange}
      options={filteredOptions}
      placeholder={placeholder}
      defaultStyles={defaultStyles}
      width={width}
      clearText={clearText}
      allowClear={allowClear}
    />
  );
};
