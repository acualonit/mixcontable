// Tasas de cotización AFP
export const TASAS_AFP = {
  CAPITAL: 12.82,
  CUPRUM: 12.82,
  HABITAT: 12.65,
  PLANVITAL: 12.54,
  PROVIDA: 12.83,
  MODELO: 11.96,
  UNO: 11.87
};

// Función para calcular el descuento de AFP
export const calcularDescuentoAFP = (sueldoImponible, afp) => {
  const tasaAFP = TASAS_AFP[afp.toUpperCase()] || 12.82; // Usa 12.82% por defecto
  return Math.round((sueldoImponible * tasaAFP) / 100);
};

// Función para calcular el descuento de salud
export const calcularDescuentoSalud = (sueldoImponible, entidadSalud, planSalud) => {
  if (entidadSalud === 'Fonasa') {
    return Math.round(sueldoImponible * 0.07); // 7% para Fonasa
  } else {
    // Para Isapre, usar el plan específico o el 7% mínimo
    const cotizacionPlan = planSalud?.monto || sueldoImponible * 0.07;
    return Math.round(Math.max(cotizacionPlan, sueldoImponible * 0.07));
  }
};

// Función para calcular el seguro de cesantía
export const calcularSeguroCesantia = (sueldoImponible, tipoContrato) => {
  // 0.6% para contratos indefinidos, 0% para otros tipos
  const tasa = tipoContrato === 'indefinido' ? 0.006 : 0;
  return Math.round(sueldoImponible * tasa);
};

// Función para calcular el impuesto único
export const calcularImpuestoUnico = (baseImponible) => {
  // Tabla de impuesto actualizada (ejemplo)
  const tablaImpuesto = [
    { desde: 0, hasta: 836379, factor: 0, rebaja: 0 },
    { desde: 836379.01, hasta: 1858620, factor: 0.04, rebaja: 33455.16 },
    { desde: 1858620.01, hasta: 3097700, factor: 0.08, rebaja: 107821.96 },
    { desde: 3097700.01, hasta: 4336780, factor: 0.135, rebaja: 277149.71 },
    { desde: 4336780.01, hasta: 5575860, factor: 0.23, rebaja: 690452.21 },
    { desde: 5575860.01, hasta: 7434480, factor: 0.304, rebaja: 1103145.21 },
    { desde: 7434480.01, hasta: Infinity, factor: 0.35, rebaja: 1447451.81 }
  ];

  // Encontrar el tramo correspondiente
  const tramo = tablaImpuesto.find(t => baseImponible > t.desde && baseImponible <= t.hasta);
  if (!tramo) return 0;

  // Calcular impuesto
  return Math.round((baseImponible * tramo.factor) - tramo.rebaja);
};

// Función principal para calcular la liquidación
export const calcularLiquidacion = (empleado, periodo) => {
  const {
    sueldoBase,
    gratificacion = 0,
    horasExtra = 0,
    valorHoraExtra = 0,
    bonos = 0,
    comisiones = 0,
    movilizacion = 0,
    colacion = 0,
    afp,
    entidadSalud,
    planSalud,
    tipoContrato
  } = empleado;

  // 1. Calcular haberes imponibles
  const horasExtraTotal = horasExtra * valorHoraExtra;
  const haberesImponibles = sueldoBase + gratificacion + horasExtraTotal + bonos + comisiones;

  // 2. Calcular haberes no imponibles
  const haberesNoImponibles = movilizacion + colacion;

  // 3. Calcular descuentos previsionales
  const descuentoAFP = calcularDescuentoAFP(haberesImponibles, afp);
  const descuentoSalud = calcularDescuentoSalud(haberesImponibles, entidadSalud, planSalud);
  const seguroCesantia = calcularSeguroCesantia(haberesImponibles, tipoContrato);

  // 4. Base imponible para impuesto
  const baseImponible = haberesImponibles - descuentoAFP - descuentoSalud - seguroCesantia;

  // 5. Calcular impuesto único
  const impuestoUnico = calcularImpuestoUnico(baseImponible);

  // 6. Calcular total de descuentos
  const totalDescuentos = descuentoAFP + descuentoSalud + seguroCesantia + impuestoUnico;

  // 7. Calcular sueldo líquido
  const sueldoLiquido = haberesImponibles + haberesNoImponibles - totalDescuentos;

  return {
    periodo,
    haberesImponibles: {
      sueldoBase,
      gratificacion,
      horasExtra: horasExtraTotal,
      bonos,
      comisiones,
      total: haberesImponibles
    },
    haberesNoImponibles: {
      movilizacion,
      colacion,
      total: haberesNoImponibles
    },
    descuentosPrevisionales: {
      afp: {
        nombre: afp,
        monto: descuentoAFP
      },
      salud: {
        nombre: entidadSalud,
        monto: descuentoSalud
      },
      seguroCesantia
    },
    impuestoUnico,
    totalDescuentos,
    sueldoLiquido,
    totalHaberes: haberesImponibles + haberesNoImponibles
  };
};