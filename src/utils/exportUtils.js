import * as XLSX from 'xlsx';

// Estilos comunes de exportación (modo empresarial, similar al módulo de Banco)
const buildStyles = (mode = 'banco') => {
  if (mode === 'banco') {
    return {
      headerStyle: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '198754' } }, // verde bootstrap (similar al header de Banco)
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'D9D9D9' } },
          bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
          left: { style: 'thin', color: { rgb: 'D9D9D9' } },
          right: { style: 'thin', color: { rgb: 'D9D9D9' } },
        },
      },
      cellBorder: {
        top: { style: 'thin', color: { rgb: 'E1E1E1' } },
        bottom: { style: 'thin', color: { rgb: 'E1E1E1' } },
        left: { style: 'thin', color: { rgb: 'E1E1E1' } },
        right: { style: 'thin', color: { rgb: 'E1E1E1' } },
      },
    };
  }

  // fallback genérico
  return {
    headerStyle: {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1F4E79' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    },
    cellBorder: {
      top: { style: 'thin', color: { rgb: 'E1E1E1' } },
      bottom: { style: 'thin', color: { rgb: 'E1E1E1' } },
      left: { style: 'thin', color: { rgb: 'E1E1E1' } },
      right: { style: 'thin', color: { rgb: 'E1E1E1' } },
    },
  };
};

export const exportToExcel = (data, fileName, options = {}) => {
  try {
    const { mode = 'banco' } = options || {};
    const { headerStyle, cellBorder } = buildStyles(mode);

    const safeData = Array.isArray(data) ? data : [];
    const ws = XLSX.utils.json_to_sheet(safeData, { skipHeader: false });

    if (ws && ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);

      // 1) Encabezados: mayúsculas + estilo
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ c: C, r: 0 });
        const cell = ws[addr];
        if (!cell) continue;
        if (cell.v !== undefined && cell.v !== null) {
          cell.v = String(cell.v).toUpperCase();
          cell.t = 's';
        }
        cell.s = { ...(cell.s || {}), ...headerStyle };
      }

      // 2) Bordes y alineación en toda la tabla + formato numérico básico
      for (let R = 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({ c: C, r: R });
          const cell = ws[addr];
          if (!cell) continue;

          cell.s = cell.s || {};
          cell.s.border = cellBorder;
          cell.s.alignment = cell.s.alignment || { vertical: 'center', wrapText: true };

          const headerAddr = XLSX.utils.encode_cell({ c: C, r: 0 });
          const headerVal = (ws[headerAddr]?.v ?? '').toString().toLowerCase();
          const isMoneyCol = ['monto', 'total', 'saldo', 'iva', 'subtotal', 'valor', 'pagado'].some(k => headerVal.includes(k));
          if (isMoneyCol && typeof cell.v === 'number') {
            cell.z = '#,##0';
            cell.s.numFmt = '#,##0';
          }
        }
      }

      // 3) Congelar encabezado
      ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

      // 4) AutoFilter
      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({ s: { c: range.s.c, r: 0 }, e: { c: range.e.c, r: 0 } }),
      };

      // 5) Ajustar ancho de columnas
      const colWidths = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLen = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const addr = XLSX.utils.encode_cell({ c: C, r: R });
          const v = ws[addr]?.v;
          if (v === undefined || v === null) continue;
          const len = String(v).length;
          if (len > maxLen) maxLen = len;
        }
        const wch = Math.min(Math.max(maxLen + 2, 12), 55);
        colWidths.push({ wch });
      }
      ws['!cols'] = colWidths;

      ws['!rows'] = ws['!rows'] || [];
      ws['!rows'][0] = { hpt: 20 };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

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