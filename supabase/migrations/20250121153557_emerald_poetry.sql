/*
  # Initial Schema for Sistema Contable

  1. New Tables
    - `empleados` - Stores employee information
    - `cargos` - Stores job positions/roles
    - `departamentos` - Stores departments
    - `sucursales` - Stores branch offices
    - `clientes` - Stores client information
    - `proveedores` - Stores supplier information
    - `bancos` - Stores bank accounts
    - `movimientos_banco` - Stores bank transactions
    - `cheques` - Stores check information
    - `ventas` - Stores sales information
    - `compras` - Stores purchase information
    - `gastos` - Stores expense information
    - `servicios` - Stores monthly services
    - `egresos_recurrentes` - Stores recurring expenses
    - `cuentas_cobrar` - Stores accounts receivable
    - `cuentas_pagar` - Stores accounts payable
    - `efectivo` - Stores cash transactions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE estado_empleado AS ENUM (
  'Activo-Laborando',
  'Renuncio',
  'Despedido',
  'Activo-Licencia',
  'Activo-Licencia-NR',
  'Activo-Vacaciones'
);

CREATE TYPE tipo_contrato AS ENUM (
  'A Plazo 1 Mes',
  'A Plazo 3 Meses',
  'A Plazo 6 Meses',
  'A Plazo 9 Meses',
  'A Plazo 12 Meses',
  'A Plazo 2 Años',
  'Indefinido',
  'Boleta de Honorario',
  'Sin Contrato'
);

CREATE TYPE metodo_pago AS ENUM (
  'efectivo',
  'transferencia',
  'debito',
  'credito',
  'cheque',
  'online',
  'credito_deuda'
);

CREATE TYPE tipo_documento AS ENUM (
  'factura_afecta',
  'factura_exenta',
  'boleta_afecta',
  'boleta_exenta',
  'boleta_honorarios',
  'voucher_credito',
  'voucher_debito',
  'otro',
  'sin_documento'
);

-- Create departamentos table
CREATE TABLE IF NOT EXISTS departamentos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cargos table
CREATE TABLE IF NOT EXISTS cargos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  departamento_id uuid REFERENCES departamentos(id),
  descripcion text,
  requisitos text,
  responsabilidades text,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sucursales table
CREATE TABLE IF NOT EXISTS sucursales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL UNIQUE,
  direccion text NOT NULL,
  region text NOT NULL,
  comuna text NOT NULL,
  ciudad text NOT NULL,
  telefono text,
  email text,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create empleados table
CREATE TABLE IF NOT EXISTS empleados (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo text NOT NULL,
  tipo_documento text NOT NULL,
  numero_documento text NOT NULL UNIQUE,
  region text NOT NULL,
  comuna text NOT NULL,
  direccion text NOT NULL,
  ciudad text NOT NULL,
  correo text NOT NULL UNIQUE,
  telefono text,
  celular text NOT NULL,
  contacto_emergencia text NOT NULL,
  celular_emergencia text NOT NULL,
  fecha_ingreso_laboral date NOT NULL,
  sucursal_id uuid REFERENCES sucursales(id),
  cargo_id uuid REFERENCES cargos(id),
  salario_liquido_real numeric NOT NULL,
  metodo_pago metodo_pago NOT NULL,
  datos_bancarios jsonb,
  fecha_inicio_contrato date NOT NULL,
  tipo_contrato tipo_contrato NOT NULL,
  fecha_vencimiento_contrato date,
  salario_bruto numeric NOT NULL,
  gratificacion numeric NOT NULL,
  entidad_salud text NOT NULL,
  nombre_isapre text,
  tipo_cotizacion text,
  valor_cotizacion numeric NOT NULL,
  estado estado_empleado NOT NULL DEFAULT 'Activo-Laborando',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clientes table
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut text NOT NULL UNIQUE,
  razon_social text NOT NULL,
  nombre_fantasia text,
  giro text NOT NULL,
  region text NOT NULL,
  comuna text NOT NULL,
  direccion text NOT NULL,
  ciudad text NOT NULL,
  contacto_principal text NOT NULL,
  telefono_principal text NOT NULL,
  email_principal text NOT NULL,
  contacto_cobranza text,
  telefono_cobranza text,
  email_cobranza text,
  condicion_venta text NOT NULL,
  limite_credito numeric NOT NULL,
  estado boolean DEFAULT true,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create proveedores table
CREATE TABLE IF NOT EXISTS proveedores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut text NOT NULL UNIQUE,
  razon_social text NOT NULL,
  nombre_fantasia text,
  giro text NOT NULL,
  region text NOT NULL,
  comuna text NOT NULL,
  direccion text NOT NULL,
  ciudad text NOT NULL,
  contacto_principal text NOT NULL,
  telefono_principal text NOT NULL,
  email_principal text NOT NULL,
  contacto_pagos text,
  telefono_pagos text,
  email_pagos text,
  condicion_pago text NOT NULL,
  limite_credito numeric NOT NULL,
  estado boolean DEFAULT true,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bancos table
CREATE TABLE IF NOT EXISTS bancos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  banco text NOT NULL,
  tipo_cuenta text NOT NULL,
  numero_cuenta text NOT NULL UNIQUE,
  sucursal_id uuid REFERENCES sucursales(id),
  saldo_actual numeric NOT NULL DEFAULT 0,
  estado boolean DEFAULT true,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create movimientos_banco table
CREATE TABLE IF NOT EXISTS movimientos_banco (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  banco_id uuid REFERENCES bancos(id),
  fecha date NOT NULL,
  tipo text NOT NULL,
  categoria text NOT NULL,
  descripcion text NOT NULL,
  monto numeric NOT NULL,
  referencia text,
  comprobante text,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cheques table
CREATE TABLE IF NOT EXISTS cheques (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text NOT NULL,
  tipo text NOT NULL,
  banco text NOT NULL,
  fecha_emision date NOT NULL,
  fecha_cobro date NOT NULL,
  monto numeric NOT NULL,
  estado text NOT NULL,
  origen_destino text NOT NULL,
  sucursal_id uuid REFERENCES sucursales(id),
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ventas table
CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha date NOT NULL,
  sucursal_id uuid REFERENCES sucursales(id),
  cliente_id uuid REFERENCES clientes(id),
  tipo_documento tipo_documento NOT NULL,
  numero_documento text,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  iva numeric NOT NULL,
  total numeric NOT NULL,
  metodo_pago_1 jsonb NOT NULL,
  metodo_pago_2 jsonb,
  estado text NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create compras table
CREATE TABLE IF NOT EXISTS compras (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha date NOT NULL,
  sucursal_id uuid REFERENCES sucursales(id),
  proveedor_id uuid REFERENCES proveedores(id),
  tipo_documento tipo_documento NOT NULL,
  numero_documento text,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  iva numeric NOT NULL,
  total numeric NOT NULL,
  metodo_pago_1 jsonb NOT NULL,
  metodo_pago_2 jsonb,
  estado text NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gastos table
CREATE TABLE IF NOT EXISTS gastos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha date NOT NULL,
  sucursal_id uuid REFERENCES sucursales(id),
  categoria text NOT NULL,
  descripcion text NOT NULL,
  tipo_documento tipo_documento NOT NULL,
  numero_documento text,
  monto numeric NOT NULL,
  metodo_pago jsonb NOT NULL,
  estado text NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create servicios table
CREATE TABLE IF NOT EXISTS servicios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  servicio text NOT NULL,
  proveedor_id uuid REFERENCES proveedores(id),
  sucursal_id uuid REFERENCES sucursales(id),
  fecha_vencimiento date NOT NULL,
  monto_estimado numeric NOT NULL,
  monto_real numeric,
  estado text NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create egresos_recurrentes table
CREATE TABLE IF NOT EXISTS egresos_recurrentes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria text NOT NULL,
  detalle_cuenta text NOT NULL,
  cuota_mes numeric NOT NULL,
  dias_pago integer NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date,
  estado text NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cuentas_cobrar table
CREATE TABLE IF NOT EXISTS cuentas_cobrar (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id uuid REFERENCES clientes(id),
  tipo_documento tipo_documento NOT NULL,
  numero_documento text,
  fecha_emision date NOT NULL,
  fecha_vencimiento date NOT NULL,
  monto_total numeric NOT NULL,
  monto_pagado numeric NOT NULL DEFAULT 0,
  estado text NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cuentas_pagar table
CREATE TABLE IF NOT EXISTS cuentas_pagar (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  proveedor_id uuid REFERENCES proveedores(id),
  tipo_documento tipo_documento NOT NULL,
  numero_documento text,
  fecha_emision date NOT NULL,
  fecha_vencimiento date NOT NULL,
  monto_total numeric NOT NULL,
  monto_pagado numeric NOT NULL DEFAULT 0,
  estado text NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create efectivo table
CREATE TABLE IF NOT EXISTS efectivo (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha date NOT NULL,
  tipo text NOT NULL,
  categoria text NOT NULL,
  descripcion text NOT NULL,
  monto numeric NOT NULL,
  sucursal_id uuid REFERENCES sucursales(id),
  referencia text,
  estado boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_banco ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos_recurrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE efectivo ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON departamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON cargos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON sucursales FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON empleados FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON proveedores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON bancos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON movimientos_banco FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON cheques FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON ventas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON compras FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON gastos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON servicios FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON egresos_recurrentes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON cuentas_cobrar FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON cuentas_pagar FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users"
ON efectivo FOR SELECT
TO authenticated
USING (true);

-- Create indexes
CREATE INDEX idx_empleados_numero_documento ON empleados(numero_documento);
CREATE INDEX idx_clientes_rut ON clientes(rut);
CREATE INDEX idx_proveedores_rut ON proveedores(rut);
CREATE INDEX idx_bancos_numero_cuenta ON bancos(numero_cuenta);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_compras_fecha ON compras(fecha);
CREATE INDEX idx_gastos_fecha ON gastos(fecha);
CREATE INDEX idx_servicios_fecha_vencimiento ON servicios(fecha_vencimiento);
CREATE INDEX idx_cuentas_cobrar_fecha_vencimiento ON cuentas_cobrar(fecha_vencimiento);
CREATE INDEX idx_cuentas_pagar_fecha_vencimiento ON cuentas_pagar(fecha_vencimiento);
CREATE INDEX idx_efectivo_fecha ON efectivo(fecha);