export const useFormatPhoneNumber = (number = '', warning = null) => {
  
  // Removing all non-numeric characters from the phone number
  number = number.replace(/\D/g, '');
  // Checking the length of the number
  if (number.length === 10) {
    // Formatting the number as (xxx) xxx-xxxx
    return '(' + number.substring(0, 3) + ') ' + number.substring(3, 6) + '-' + number.substring(6);
  } else if (number.length === 11) {
    // Formatting the number as +x (xxx) xxx-xxxx
    return '+' + number[0] + ' (' + number.substring(1, 4) + ') ' + number.substring(4, 7) + '-' + number.substring(7);
  } else {
    // If the number is not 10 or 11 digits, return the original number
    if(warning !== null){
      return '10 o 11 dígitos';
    }
    if(warning === null){
      return number
    }
  }


}
