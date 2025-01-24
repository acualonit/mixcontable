import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para guardar comprobante de pago
export const guardarComprobantePago = async (comprobante) => {
  try {
    const { data, error } = await supabase
      .from('comprobantes_pago')
      .insert([{
        periodo: comprobante.periodo,
        empleado_id: comprobante.empleado.id,
        total_haberes: comprobante.totales.totalHaberes,
        total_descuentos: comprobante.totales.totalDescuentos,
        sueldo_liquido: comprobante.totales.sueldoLiquido,
        bonos: comprobante.totales.bonos,
        comisiones: comprobante.totales.comisiones,
        horas_extras: comprobante.totales.horasExtras,
        anticipos: comprobante.totales.anticipos,
        otros_descuentos: comprobante.totales.otrosDescuentos,
        pdf_data: comprobante.pdfData
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al guardar el comprobante:', error);
    throw new Error('Error al guardar el comprobante en la base de datos');
  }
};

// Función para obtener comprobantes de pago
export const obtenerComprobantesPago = async (periodo) => {
  try {
    let query = supabase
      .from('comprobantes_pago')
      .select(`
        *,
        empleado:empleado_id (
          nombre_completo,
          numero_documento
        )
      `)
      .order('created_at', { ascending: false });

    if (periodo) {
      query = query.eq('periodo', periodo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener los comprobantes:', error);
    throw new Error('Error al obtener los comprobantes de la base de datos');
  }
};