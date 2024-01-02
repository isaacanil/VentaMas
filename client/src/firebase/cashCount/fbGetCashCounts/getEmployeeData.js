import { getDoc } from "firebase/firestore";

export async function getEmployeeData(employeeRef) {
    // Comprobación anticipada para un argumento nulo
    if (!employeeRef) return null;
    try {
        const employeeDoc = (await getDoc(employeeRef)).data();
        // Asegurarse de que el documento y el usuario existen y tienen la forma esperada
        if (!employeeDoc || !employeeDoc.user) {
            throw new Error('Documento de empleado no encontrado o mal formado');
        }
        const employeeUser = employeeDoc.user;
        return {
            id: employeeUser.id,
            name: employeeUser.name,
        };
    } catch (error) {
        // Manejo adecuado de cualquier error que pueda ocurrir durante la recuperación del documento
        console.error('Error al obtener datos del empleado:', error);
        return null;
    }
}
