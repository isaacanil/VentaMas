// export const UpdateObjectProperty = (
//     mainObject, secondObject, setObject, propertyToChangeValue,
//     newValue, dataType, maxCharacters
// ) => {
    
//     switch (dataType) {
//         case 'string':
//             newValue = String(newValue);
//             break;
//         case 'number':
//             newValue = Number(newValue);
//             break;
//         default:
//             break;
//     }
//     if (newValue.length > maxCharacters) {
//         newValue = newValue.slice(-maxCharacters);
//         setTimeout(()=>{newValue = newValue.substring(0, maxCharacters)}, 1)
        
//     }
    
//     setObject({
//         ...mainObject,
//         [secondObject]: {
//             ...mainObject[secondObject],
//             [propertyToChangeValue]:  newValue 
//         }
//     })


// }