import { useState, useEffect } from 'react';

const useFormatTimestamp = (timestamp) => {
 
    const formattedDate = new Date(timestamp.seconds * 1000).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
   
    return formattedDate;

}

export default useFormatTimestamp;