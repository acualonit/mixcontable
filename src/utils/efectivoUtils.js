// Función reutilizable para registrar movimientos de efectivo
export const registrarMovimientoEfectivo = async (movimiento) => {
  try {
    // Aquí irá la lógica para guardar el movimiento en la base de datos
    console.log('Registrando movimiento en efectivo:', movimiento);
  } catch (error) {
    console.error('Error al registrar movimiento en efectivo:', error);
    throw new Error('Error al registrar el movimiento en efectivo');
  }
};