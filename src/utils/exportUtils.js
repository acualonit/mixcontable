import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    alert('Error al exportar a Excel. Por favor, intente nuevamente.');
  }
};

// Función helper para formatear fechas en el formato dd/mm/yyyy
export const formatDateForExcel = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL');
};

// Función helper para formatear números como moneda
export const formatCurrency = (number) => {
  if (typeof number !== 'number') return '';
  return number.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

// Función helper para preparar datos para exportación
export const prepareDataForExport = (data, options = {}) => {
  const { formatDates = true, formatNumbers = true } = options;
  
  return data.map(item => {
    const preparedItem = {};
    
    for (const [key, value] of Object.entries(item)) {
      if (formatDates && (key.toLowerCase().includes('fecha') || key.toLowerCase().includes('date'))) {
        preparedItem[key] = formatDateForExcel(value);
      } else if (formatNumbers && typeof value === 'number' && 
                (key.toLowerCase().includes('monto') || 
                 key.toLowerCase().includes('valor') || 
                 key.toLowerCase().includes('total') || 
                 key.toLowerCase().includes('saldo'))) {
        preparedItem[key] = formatCurrency(value);
      } else {
        preparedItem[key] = value;
      }
    }
    
    return preparedItem;
  });
};