

    

export const orderAndDataState = [
    { id: 'state_1', name: 'Atrasado', color: '#e66767',},
    { id: 'state_2', name: 'Solicitado', color: '#ebdc54',},
    { id: 'state_3', name: 'Entregado', color: '#7de08b',},
    { id: 'state_4', name: 'Cancelado', color: '#797979',},
    { id: 'state_5', name: 'Eliminado', color: '#797979',},
]

export const orderAndDataCondition = [
    { id: 'condition_0001', name: 'Contado', },
    { id: 'condition_0002', name: '1 semana',},
    { id: 'condition_0003', name: '15 días', },
    { id: 'condition_0004', name: '30 días',},
    { id: 'condition_0005', name: 'Otros',},
]

export const getOrderConditionByID = (conditionID) => {
    if(conditionID){
        const condition = orderAndDataCondition.find(c => c.id === conditionID);
        return condition?.name;
    }
    return conditionID || '';
}
export const getOrderStateByID = (stateID) => {
    if(stateID){
        const state = orderAndDataState.find(s => s.id === stateID);
        return state;
    }
    return stateID || '';
}
export const selectItemByName = (array, name) => {
    const item = array.find(i => i.name === name);
    return item.id;
};
