
export const modifyOrderMenuData = (array, setArray, index, property, subProperty, subIndex, newValue) => {
    const arrayUpdated = [...array];
    if (subProperty && subIndex) {
        arrayUpdated[index][property][subIndex][subProperty] = newValue;
    } else if (subProperty) {
        arrayUpdated[index][property][subProperty] = newValue;
    } else {
        arrayUpdated[index][property] = newValue;
    }
    setArray(arrayUpdated);
}

