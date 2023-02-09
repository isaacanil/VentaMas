import { nanoid } from "nanoid"

export const orderAndDataState = [
    { id: 'state_1234', name: 'Atrasado', color: '#e66767', selected: false },
    { id: 'state_5378', name: 'Solicitado', color: '#ebdc54', selected: false },
    { id: 'state_9111', name: 'Entregado', color: '#7de08b', selected: false },
    { id: 'state_1192', name: 'Cancelado', color: '#797979', selected: false },
]
export const orderAndDataCondition = [
    { id: 'condition_1334', name: 'Contado', selected: false },
    { id: 'condition_5678', name: '1 semana', selected: false },
    { id: 'condition_9131', name: '15 días', selected: false },
    { id: 'condition_1142', name: '30 días', selected: false },
    { id: 'condition_3244', name: 'Otros', selected: false },
]

export const selectItemByName = (array, name) => {
    const item = array.find(i => i.name === name);
    return item;
};
