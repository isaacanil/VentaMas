import {
  faCalendarDay,
  faCalendarDays,
  faCalendarWeek,
  faEllipsis,
  faMoneyBill,
} from '@fortawesome/free-solid-svg-icons';

export const orderAndDataState = [
  { id: 'state_1', name: 'Atrasado', color: '#e66767' },
  { id: 'state_2', name: 'Solicitado', color: '#ebdc54' },
  { id: 'state_3', name: 'Entregado', color: '#7de08b' },
  { id: 'state_4', name: 'Cancelado', color: '#797979' },
];
export const transactionStatuses = [
  { id: 'delayed', name: 'Atrasado', color: '#e66767' },
  { id: 'pending', name: 'Pendiente', color: '#f5a623' },
  { id: 'requested', name: 'Solicitado', color: '#ebdc54' },
  { id: 'delivered', name: 'Entregado', color: '#7de08b' },
  { id: 'canceled', name: 'Cancelado', color: '#797979' },
];

export const transactionConditions = [
  { id: 'cash', label: 'Contado', icon: faMoneyBill },
  { id: 'one_week', label: '1 semana', icon: faCalendarWeek },
  { id: 'fifteen_days', label: '15 días', icon: faCalendarDay },
  { id: 'thirty_days', label: '30 días', icon: faCalendarDays },
  { id: 'other', label: 'Otros', icon: faEllipsis },
];

export const orderAndDataCondition = [
  { id: 'condition_0001', name: 'Contado' },
  { id: 'condition_0002', name: '1 semana' },
  { id: 'condition_0003', name: '15 días' },
  { id: 'condition_0004', name: '30 días' },
  { id: 'condition_0005', name: 'Otros' },
];

export const getDefaultTransactionStatus = () => {
  return transactionStatuses.find((status) => status.id === 'pending');
};

export const getDefaultTransactionCondition = () => {
  return transactionConditions.find((condition) => condition.id === 'cash'); // Cambiar de condition.value a condition.id
};

export const getTransactionConditionById = (conditionKey) => {
  if (!conditionKey) return null;
  return transactionConditions.find((c) => c.id === conditionKey) || null; // Cambiar de c.value a c.id
};

export const getTransactionStateById = (stateKey) => {
  if (stateKey) {
    const state = transactionStatuses.find((s) => s.id === stateKey);
    return state || null;
  }
  return stateKey || null;
};

export const getOrderConditionByID = (conditionID) => {
  if (conditionID) {
    const condition = orderAndDataCondition.find((c) => c.id === conditionID);
    return condition;
  }
  return conditionID || null;
};
export const getOrderStateByID = (stateID) => {
  if (stateID) {
    const state = orderAndDataState.find((s) => s.id === stateID);
    return state;
  }
  return stateID || '';
};
export const selectItemByName = (array, name) => {
  const item = array.find((i) => i.name === name);
  return item.id;
};
