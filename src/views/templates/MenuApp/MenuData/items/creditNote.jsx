import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

const { CREDIT_NOTE_LIST } = ROUTES_NAME.CREDIT_NOTE_TERM;

const creditNote = [
  {
    title: 'Notas de Crédito',
    icon: icons.finances.fileInvoiceDollar,
    route: CREDIT_NOTE_LIST,
    group: 'financialManagement',
  },
];

export default creditNote;
