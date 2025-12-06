import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName) => {
  try {
    // crear hoja desde JSON
    const ws = XLSX.utils.json_to_sheet(data);

    // convertir encabezados a mayúsculas y aplicar negrita
    if (ws && ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      // la primera fila (r = 0) contiene los encabezados generados por json_to_sheet
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
        const cell = ws[cellAddress];
        if (cell && cell.v) {
          // poner texto en mayúsculas
          cell.v = String(cell.v).toUpperCase();
          cell.t = 's';
          // aplicar estilo de negrita (SheetJS soporta estilos básicos)
          cell.s = cell.s || {};
          cell.s.font = { ...(cell.s.font || {}), bold: true };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");

    // Intentar escribir con estilos (cellStyles: true)
    XLSX.writeFile(wb, `${fileName}.xlsx`, { bookType: 'xlsx', cellStyles: true });
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