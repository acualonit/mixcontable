// Constantes para cálculos de nómina chilena
export const MINIMUM_WAGE = 460000; // Actualizar según corresponda
export const UF_VALUE = 35000; // Actualizar según corresponda
export const UTM_VALUE = 65000; // Actualizar según corresponda

// Bases máximas de cotización
export const MAX_CONTRIBUTION_BASE_UF = 81.7;
export const MAX_UNEMPLOYMENT_BASE_UF = 122.7;

// Tasas de salud
export const FONASA_RATE = 0.07;

// Tasas de seguro de cesantía
export const UNEMPLOYMENT_RATE = 0.006;

// Tramos de impuesto (basados en UTM) - Actualizar según SII
export const TAX_BRACKETS = [
  { from: 0, to: 13.5, rate: 0, deduction: 0 },
  { from: 13.5, to: 30, rate: 0.04, deduction: 0.54 },
  { from: 30, to: 50, rate: 0.08, deduction: 1.74 },
  { from: 50, to: 70, rate: 0.135, deduction: 4.49 },
  { from: 70, to: 90, rate: 0.23, deduction: 11.14 },
  { from: 90, to: 120, rate: 0.304, deduction: 17.8 },
  { from: 120, to: Infinity, rate: 0.35, deduction: 23.32 }
];

// Calcular valor hora extra
export const calculateOvertimeRate = (baseSalary) => {
  // Fórmula: (sueldoBase / 30 * 28) / 176 * 1.5
  return (baseSalary / 30 * 28) / 176 * 1.5;
};

// Calcular gratificación
export const calculateGratification = (baseSalary) => {
  const gratificationLimit = MINIMUM_WAGE * 4.75;
  const gratification = baseSalary * 0.25;
  return Math.min(gratification, gratificationLimit);
};

// Calcular base de cotización
export const calculateContributionBase = (baseSalary) => {
  const maxContribution = UF_VALUE * MAX_CONTRIBUTION_BASE_UF;
  return Math.min(baseSalary, maxContribution);
};

// Calcular base de seguro de cesantía
export const calculateUnemploymentBase = (baseSalary) => {
  const maxUnemployment = UF_VALUE * MAX_UNEMPLOYMENT_BASE_UF;
  return Math.min(baseSalary, maxUnemployment);
};

// Calcular descuento AFP
export const calculateAFPDeduction = (contributionBase, afpRate) => {
  return Math.round(contributionBase * (afpRate / 100));
};

// Calcular descuento de salud
export const calculateHealthDeduction = (contributionBase, isapre = null) => {
  if (!isapre) {
    return Math.round(contributionBase * FONASA_RATE);
  }
  // Cálculo ISAPRE (basado en UF)
  return Math.max(
    Math.round(contributionBase * FONASA_RATE),
    Math.round(isapre.ufAmount * UF_VALUE)
  );
};

// Calcular seguro de cesantía
export const calculateUnemploymentInsurance = (base, isIndefinite) => {
  if (!isIndefinite) return 0;
  return Math.round(base * UNEMPLOYMENT_RATE);
};

// Calcular impuesto a la renta
export const calculateIncomeTax = (taxableBase) => {
  const utmBase = taxableBase / UTM_VALUE;
  const bracket = TAX_BRACKETS.find(b => utmBase > b.from && utmBase <= b.to);
  if (!bracket) return 0;
  
  const tax = (taxableBase * bracket.rate) - (UTM_VALUE * bracket.deduction);
  return Math.round(Math.max(0, tax));
};

// Calcular liquidación completa
export const calculateSalaryLiquidation = ({
  baseSalary,
  afpRate,
  isapre = null,
  contractType,
  overtimeHours = 0,
  bonuses = 0,
  allowances = {
    mobilization: 0,
    lunch: 0
  },
  advances = 0
}) => {
  // Validar sueldo base
  if (baseSalary < MINIMUM_WAGE) {
    throw new Error('El sueldo base no puede ser menor al sueldo mínimo');
  }

  // Calcular bases
  const contributionBase = calculateContributionBase(baseSalary);
  const unemploymentBase = calculateUnemploymentBase(baseSalary);

  // Calcular haberes imponibles
  const overtimePay = calculateOvertimeRate(baseSalary) * overtimeHours;
  const gratification = calculateGratification(baseSalary);
  const totalImponibleEarnings = baseSalary + overtimePay + gratification + bonuses;

  // Calcular haberes no imponibles
  const totalNonImponibleEarnings = allowances.mobilization + allowances.lunch;

  // Calcular descuentos
  const afpDeduction = calculateAFPDeduction(contributionBase, afpRate);
  const healthDeduction = calculateHealthDeduction(contributionBase, isapre);
  const unemploymentInsurance = calculateUnemploymentInsurance(
    unemploymentBase,
    contractType === 'indefinido'
  );

  // Calcular base tributable
  const taxableBase = totalImponibleEarnings - afpDeduction - healthDeduction - unemploymentInsurance;

  // Calcular impuesto a la renta
  const incomeTax = calculateIncomeTax(taxableBase);

  // Calcular descuentos totales
  const legalDeductions = afpDeduction + healthDeduction + unemploymentInsurance + incomeTax;
  const otherDeductions = advances;
  const totalDeductions = legalDeductions + otherDeductions;

  // Calcular montos finales
  const grossSalary = totalImponibleEarnings + totalNonImponibleEarnings;
  const netSalary = grossSalary - totalDeductions;

  return {
    bases: {
      contribution: contributionBase,
      unemployment: unemploymentBase,
      taxable: taxableBase
    },
    earnings: {
      imponible: {
        base: baseSalary,
        overtime: overtimePay,
        gratification,
        bonuses,
        total: totalImponibleEarnings
      },
      nonImponible: {
        mobilization: allowances.mobilization,
        lunch: allowances.lunch,
        total: totalNonImponibleEarnings
      },
      total: grossSalary
    },
    deductions: {
      legal: {
        afp: afpDeduction,
        health: healthDeduction,
        unemployment: unemploymentInsurance,
        tax: incomeTax,
        total: legalDeductions
      },
      other: {
        advances,
        total: otherDeductions
      },
      total: totalDeductions
    },
    totals: {
      gross: grossSalary,
      net: netSalary
    }
  };
};

// Utilidad para convertir números a palabras en español
export const numberToSpanishWords = (number) => {
  const units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (number === 0) return 'cero';
  if (number < 0) return 'menos ' + numberToSpanishWords(Math.abs(number));

  let words = '';

  // Manejar millones
  if (number >= 1000000) {
    const millions = Math.floor(number / 1000000);
    number %= 1000000;
    words += millions === 1 ? 'un millón ' : numberToSpanishWords(millions) + ' millones ';
  }

  // Manejar miles
  if (number >= 1000) {
    const thousands = Math.floor(number / 1000);
    number %= 1000;
    if (thousands === 1) {
      words += 'mil ';
    } else {
      words += numberToSpanishWords(thousands) + ' mil ';
    }
  }

  // Manejar centenas
  if (number >= 100) {
    if (number === 100) {
      words += 'cien ';
    } else {
      words += hundreds[Math.floor(number / 100)] + ' ';
    }
    number %= 100;
  }

  // Manejar decenas y unidades
  if (number > 0) {
    if (number < 10) {
      words += units[number];
    } else if (number < 20) {
      words += teens[number - 10];
    } else {
      const ten = Math.floor(number / 10);
      const unit = number % 10;
      if (unit === 0) {
        words += tens[ten];
      } else {
        words += tens[ten] + ' y ' + units[unit];
      }
    }
  }

  return words.trim();
};

// Formatear moneda para mostrar
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};