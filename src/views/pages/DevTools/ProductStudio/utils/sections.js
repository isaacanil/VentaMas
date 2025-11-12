import {
  BarcodeOutlined,
  DollarOutlined,
  QrcodeOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
} from '@ant-design/icons';

export const FORM_SECTIONS = [
  { id: 'identity', label: 'Identidad', icon: TagOutlined },
  { id: 'pricing', label: 'Precios', icon: DollarOutlined },
  { id: 'inventory', label: 'Inventario', icon: BarcodeOutlined },
  { id: 'warranty', label: 'Garantía', icon: SafetyCertificateOutlined },
  { id: 'codes', label: 'Códigos', icon: QrcodeOutlined },
];

export const getSectionDomId = (sectionId) => `section-${sectionId}`;
