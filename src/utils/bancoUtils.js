// Función reutilizable para registrar movimientos bancarios
export const registrarMovimientoBancario = async (movimiento) => {
  try {
    // Aquí irá la lógica para guardar el movimiento en la base de datos
    console.log('Registrando movimiento bancario:', movimiento);
  } catch (error) {
    console.error('Error al registrar movimiento bancario:', error);
    throw new Error('Error al registrar el movimiento bancario');
  }
};