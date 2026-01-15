import { useMemo } from 'react';

export function useBillsByMonth(bills: any[]) {
  const billCounts = useMemo(() => {
    // Creamos un objeto vacío para almacenar el número de facturas por mes
    const billCountsByMonth: Record<number, number> = {};

    // Iteramos sobre el array de facturas
    bills.forEach(({ data }: any) => {
      // Obtenemos el mes de la factura
      const month = new Date(data.date.seconds * 1000).getMonth();

      // Si aún no existe una propiedad para este mes, la creamos
      if (!billCountsByMonth[month]) {
        billCountsByMonth[month] = 0;
      }

      // Incrementamos el contador de facturas para este mes
      billCountsByMonth[month]++;
    });

    // Creamos un arreglo con el número de facturas por mes en orden cronológico
    const counts = [];
    for (let i = 0; i < 12; i++) {
      counts.push(billCountsByMonth[i] || 0);
    }
    return counts;
  }, [bills]);

  // Devolvemos el arreglo con el número de facturas por mes
  return billCounts;
}

export function useBillsByDay(bills: any[]) {
  const billCounts = useMemo(() => {
    // Creamos un objeto vacío para almacenar el número de facturas por día
    const billCountsByDay: Record<number, number> = {};

    // Iteramos sobre el array de facturas
    bills.forEach(({ data }) => {
      // Obtenemos la fecha de la factura
      const date = new Date(data.date.seconds * 1000);

      // Obtenemos el día de la fecha de la factura
      const day = date.getDate();

      // Si aún no existe una propiedad para este día, la creamos
      if (!billCountsByDay[day]) {
        billCountsByDay[day] = 0;
      }

      // Incrementamos el contador de facturas para este día
      billCountsByDay[day]++;
    });

    // Creamos un arreglo con el número de facturas por día en orden cronológico
    const counts = [];
    for (let i = 1; i <= 31; i++) {
      counts.push(billCountsByDay[i] || 0);
    }
    return counts;
  }, [bills]);

  // Devolvemos el arreglo con el número de facturas por día
  return billCounts;
}
