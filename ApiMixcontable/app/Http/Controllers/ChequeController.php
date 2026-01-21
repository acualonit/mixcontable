<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use App\Models\Cheque;

class ChequeController extends Controller
{
    public function index(Request $request)
    {
        // Siempre unir con cuentas_bancarias para exponer nombre de banco y número de cuenta
        $query = DB::table('cheques')
            ->leftJoin('cuentas_bancarias', 'cheques.cuenta_id', '=', 'cuentas_bancarias.id')
            // Tabla real: users (ver db_dep/users.sql)
            ->leftJoin('users', 'cheques.user_id', '=', 'users.id')
            ->select(
                'cheques.*',
                'cuentas_bancarias.banco as cuenta_banco',
                'cuentas_bancarias.numero_cuenta as cuenta_numero',
                // users tiene name/email
                DB::raw('COALESCE(users.name, users.email) as usuario_nombre')
            );

        // No mostrar cheques eliminados (deleted_at)
        $query->whereNull('cheques.deleted_at');

        // Filtrado: normalizamos comparaciones a minúsculas para mayor tolerancia
        if ($request->filled('estado')) {
            $estado = strtolower($request->get('estado'));
            $query->whereRaw('LOWER(cheques.estado) = ?', [$estado]);
        }

        if ($request->filled('fecha_cobro')) {
            $query->where('cheques.fecha_cobro', $request->get('fecha_cobro'));
        }

        if ($request->filled('banco')) {
            // permitir buscar por "Banco - numero_cuenta" o por banco o por numero
            $banco = strtolower($request->get('banco'));
            $query->where(function($q) use ($banco) {
                $q->whereRaw('LOWER(CONCAT(cuentas_bancarias.banco, " - ", cuentas_bancarias.numero_cuenta)) LIKE ?', ["%{$banco}%"])
                  ->orWhereRaw('LOWER(cuentas_bancarias.banco) = ?', [$banco])
                  ->orWhere('cuentas_bancarias.numero_cuenta', $banco);
            });
        }

        if ($request->filled('tipo')) {
            // Frontend envía: emitido/recibido. DB enum: Emitidos/Recibidos.
            $tipoIn = strtolower(trim((string)$request->get('tipo')));
            $tipo = $tipoIn;
            if (in_array($tipoIn, ['emitido', 'emitidos'], true)) $tipo = 'Emitidos';
            if (in_array($tipoIn, ['recibido', 'recibidos'], true)) $tipo = 'Recibidos';

            if (in_array($tipo, ['Emitidos', 'Recibidos'], true)) {
                $query->where('cheques.tipo', $tipo);
            } else {
                // fallback tolerante
                $query->whereRaw('LOWER(cheques.tipo) LIKE ?', ['%' . $tipoIn . '%']);
            }
        }

        $cheques = $query->orderBy('cheques.created_at', 'desc')->get();

        return response()->json(['data' => $cheques]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'cuenta_id' => ['required','integer'],
            'numero_cheque' => ['required','string'],
            'tipo' => ['nullable','string'],
            'fecha_emision' => ['required','date'],
            'fecha_cobro' => ['nullable','date'],
            'beneficiario' => ['required','string'],
            'concepto' => ['nullable','string'],
            'monto' => ['required','numeric'],
            'estado' => ['nullable','string'],
            'observaciones' => ['nullable','string'],
            // permitir override explícito solo si lo envían (opcional)
            'user_id' => ['nullable','integer'],
        ]);

        // Si ya existe la columna user_id, siempre registrar el usuario autenticado (si hay sesión)
        if (Schema::hasColumn('cheques', 'user_id')) {
            $authId = auth()->id();
            if ($authId) {
                $data['user_id'] = $authId;
            }
        } else {
            unset($data['user_id']);
        }

        // Normalizar tipo (DB: Emitidos/Recibidos)
        if (!array_key_exists('tipo', $data) || $data['tipo'] === null || trim((string)$data['tipo']) === '') {
            $data['tipo'] = 'Emitidos';
        } else {
            $tipoIn = strtolower(trim((string)$data['tipo']));
            $mapTipo = [
                'emitido' => 'Emitidos',
                'emitidos' => 'Emitidos',
                'recibido' => 'Recibidos',
                'recibidos' => 'Recibidos',
                'emitidos' => 'Emitidos',
                'recibidos' => 'Recibidos',
            ];
            $data['tipo'] = $mapTipo[$tipoIn] ?? $data['tipo'];
            if (!in_array($data['tipo'], ['Emitidos', 'Recibidos'], true)) {
                $data['tipo'] = 'Emitidos';
            }
        }

        // Normalizar estado (DB: Pendiente/Cobrado/Rechazado/Prestado)
        $allowedEstados = ['Pendiente', 'Cobrado', 'Rechazado', 'Prestado'];
        $estadoIn = trim((string)($data['estado'] ?? ''));
        $estadoKey = strtolower($estadoIn);
        $mapEstado = [
            '' => 'Pendiente',
            'pendiente' => 'Pendiente',
            'cobrado' => 'Cobrado',
            'rechazado' => 'Rechazado',
            'prestado' => 'Prestado',
            // compat antiguos/otros
            'emitido' => 'Pendiente',
            'emitidos' => 'Pendiente',
            'emision' => 'Pendiente',
            'anulado' => 'Rechazado',
        ];
        $estadoMapped = $mapEstado[$estadoKey] ?? $estadoIn;
        $data['estado'] = in_array($estadoMapped, $allowedEstados, true) ? $estadoMapped : 'Pendiente';

        // Si la tabla tiene columna id_sucursal, obtenerla desde la cuenta bancaria seleccionada
        if (Schema::hasColumn('cheques', 'id_sucursal')) {
            if (!empty($data['cuenta_id'])) {
                $cuenta = DB::table('cuentas_bancarias')->where('id', $data['cuenta_id'])->first();
                if ($cuenta && property_exists($cuenta, 'id_sucursal')) {
                    $data['id_sucursal'] = $cuenta->id_sucursal;
                } elseif ($cuenta && property_exists($cuenta, 'id_sucursal') === false && property_exists($cuenta, 'id_sucursal') !== null) {
                    // fallback: if cuenta has id_sucursal under different name (id_sucursal may be id_sucursal)
                    $data['id_sucursal'] = $cuenta->id_sucursal ?? null;
                }
            }
        } else {
            // Ensure we don't try to set id_sucursal if column doesn't exist
            if (isset($data['id_sucursal'])) unset($data['id_sucursal']);
        }

        $cheque = Cheque::create($data);

        return response()->json(['data' => $cheque], 201);
    }

    public function show($id)
    {
        // Obtener cheque junto con datos de la cuenta bancaria (banco y numero de cuenta) y usuario
        $item = DB::table('cheques')
            ->leftJoin('cuentas_bancarias', 'cheques.cuenta_id', '=', 'cuentas_bancarias.id')
            ->leftJoin('users', 'cheques.user_id', '=', 'users.id')
            ->select(
                'cheques.*',
                'cuentas_bancarias.banco as cuenta_banco',
                'cuentas_bancarias.numero_cuenta as cuenta_numero',
                DB::raw('COALESCE(users.name, users.email) as usuario_nombre')
            )
            ->where('cheques.id', $id)
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Cheque no encontrado'], 404);
        }

        return response()->json(['data' => $item]);
    }

    /**
     * Crear o reactivar movimiento bancario para un cheque usando columnas reales.
     * Reglas:
     * - Si existe movimiento activo para cheque_id: actualizar datos.
     * - Si existe solo soft-deleted: reactivar (deleted_at = NULL) y actualizar.
     * - Si no existe: insertar.
     */
    private function upsertMovimientoBancoPorCheque(Cheque $cheque): void
    {
        if (!Schema::hasTable('movimientos_banco')) return;

        $cols = Schema::getColumnListing('movimientos_banco');
        $required = ['cheque_id', 'cuenta_id', 'fecha', 'monto', 'tipo_movimiento'];
        foreach ($required as $r) {
            if (!in_array($r, $cols, true)) {
                Log::warning('ChequeController: movimientos_banco sin columna requerida', ['missing' => $r, 'cols' => $cols]);
                return;
            }
        }

        if (empty($cheque->cuenta_id)) {
            Log::warning('ChequeController: cheque sin cuenta_id, no se puede reflejar en banco', ['cheque_id' => $cheque->id]);
            return;
        }

        $tipoMov = 'INGRESO';
        $tipoCheque = strtolower(trim((string)($cheque->tipo ?? '')));
        if (strpos($tipoCheque, 'emit') !== false) $tipoMov = 'EGRESO';

        $fechaValue = $cheque->fecha_cobro ?: now()->toDateString();
        $montoValue = (float)($cheque->monto ?? 0);

        // Preparar payload usando SOLO columnas existentes
        $data = [
            'cheque_id' => (int)$cheque->id,
            'cuenta_id' => (int)$cheque->cuenta_id,
            'fecha' => $fechaValue,
            'monto' => $montoValue,
            'tipo_movimiento' => $tipoMov,
        ];

        if (in_array('descripcion', $cols, true)) {
            $data['descripcion'] = 'Cobro de cheque N° ' . (string)($cheque->numero_cheque ?? $cheque->id);
        }
        if (in_array('categoria', $cols, true)) {
            $data['categoria'] = 'Cheque';
        }
        if (in_array('observaciones', $cols, true)) {
            $data['observaciones'] = trim((string)($cheque->observaciones ?? ''));
        }
        if (in_array('referencia', $cols, true)) {
            $data['referencia'] = (string)($cheque->numero_cheque ?? $cheque->id);
        }
        if (in_array('user_id', $cols, true)) {
            $authId = auth()->id();
            if ($authId) $data['user_id'] = $authId;
        }
        if (in_array('updated_at', $cols, true)) $data['updated_at'] = now();
        if (in_array('deleted_at', $cols, true)) $data['deleted_at'] = null;

        // Elegir registro a afectar: primero activo, si no, el último eliminado
        $targetId = DB::table('movimientos_banco')
            ->where('cheque_id', (int)$cheque->id)
            ->when(in_array('deleted_at', $cols, true), fn($q) => $q->whereNull('deleted_at'))
            ->value('id');

        if (!$targetId && in_array('deleted_at', $cols, true)) {
            $targetId = DB::table('movimientos_banco')
                ->where('cheque_id', (int)$cheque->id)
                ->whereNotNull('deleted_at')
                ->orderByDesc('id')
                ->value('id');
        }

        if ($targetId) {
            Log::info('ChequeController: update movimiento_banco por cheque', ['id' => $targetId, 'cheque_id' => $cheque->id]);
            DB::table('movimientos_banco')->where('id', (int)$targetId)->update($data);
            return;
        }

        // Insert
        if (in_array('created_at', $cols, true)) $data['created_at'] = now();
        Log::info('ChequeController: insert movimiento_banco por cheque', ['cheque_id' => $cheque->id]);
        DB::table('movimientos_banco')->insert($data);
    }

    private function softDeleteMovimientoBancoPorCheque(Cheque $cheque): void
    {
        if (!Schema::hasTable('movimientos_banco')) return;
        $cols = Schema::getColumnListing('movimientos_banco');
        if (!in_array('cheque_id', $cols, true) || !in_array('deleted_at', $cols, true)) return;

        $update = ['deleted_at' => now()];
        if (in_array('updated_at', $cols, true)) $update['updated_at'] = now();

        DB::table('movimientos_banco')
            ->where('cheque_id', (int)$cheque->id)
            ->whereNull('deleted_at')
            ->update($update);
    }

    public function update(Request $request, $id)
    {
        // Para rechazar/editar NO se debe tocar deleted_at, por eso NO usamos delete aquí.
        // Además, el rechazo podría aplicarse incluso si estuvo eliminado previamente, por eso withTrashed.
        $cheque = Cheque::withTrashed()->find($id);
        if (!$cheque) {
            return response()->json(['message' => 'Cheque no encontrado'], 404);
        }

        $prevEstado = strtolower(trim((string)($cheque->estado ?? '')));

        $data = $request->validate([
            'cuenta_id' => ['nullable','integer'],
            'numero_cheque' => ['nullable','string'],
            'tipo' => ['nullable','string'],
            'fecha_emision' => ['nullable','date'],
            'fecha_cobro' => ['nullable','date'],
            'beneficiario' => ['nullable','string'],
            'concepto' => ['nullable','string'],
            'monto' => ['nullable','numeric'],
            'estado' => ['nullable','string'],
            'observaciones' => ['nullable','string'],
            'user_id' => ['nullable','integer'],
        ]);

        // Si el cheque proviene de una venta, permitir editar SOLO fecha_cobro (y estado/user_id si aplica)
        // Marca: "ORIGEN:VENTA" en observaciones.
        $obs = (string)($cheque->observaciones ?? '');
        $isFromVenta = stripos($obs, 'origen:venta') !== false;
        if ($isFromVenta) {
            $allowedKeys = ['fecha_cobro', 'estado', 'user_id'];
            $data = array_intersect_key($data, array_flip($allowedKeys));
        }

        if (Schema::hasColumn('cheques', 'user_id')) {
            $authId = auth()->id();
            if ($authId) {
                $data['user_id'] = $authId;
            }
        } else {
            unset($data['user_id']);
        }

        if (array_key_exists('tipo', $data)) {
            $tipoIn = trim((string)$data['tipo']);
            if ($tipoIn === '') {
                unset($data['tipo']);
            } else {
                $tipoKey = strtolower($tipoIn);
                $mapTipo = [
                    'emitido' => 'Emitidos',
                    'emitidos' => 'Emitidos',
                    'recibido' => 'Recibidos',
                    'recibidos' => 'Recibidos',
                ];
                $tipoMapped = $mapTipo[$tipoKey] ?? $tipoIn;
                $data['tipo'] = in_array($tipoMapped, ['Emitidos', 'Recibidos'], true) ? $tipoMapped : $cheque->tipo;
            }
        }

        if (array_key_exists('estado', $data)) {
            $allowedEstados = ['Pendiente', 'Cobrado', 'Rechazado', 'Prestado'];
            $estadoIn = trim((string)$data['estado']);
            if ($estadoIn === '') {
                unset($data['estado']);
            } else {
                $estadoKey = strtolower($estadoIn);
                $mapEstado = [
                    'pendiente' => 'Pendiente',
                    'cobrado' => 'Cobrado',
                    'rechazado' => 'Rechazado',
                    'prestado' => 'Prestado',
                    'emitido' => 'Pendiente',
                    'anulado' => 'Rechazado',
                ];
                $estadoMapped = $mapEstado[$estadoKey] ?? $estadoIn;
                $data['estado'] = in_array($estadoMapped, $allowedEstados, true) ? $estadoMapped : $cheque->estado;
            }
        }

        // Para update también asignar id_sucursal desde la cuenta si corresponde
        // Nota: si el cheque es de venta, no permitimos cambiar cuenta_id (ya filtrado arriba).
        if (Schema::hasColumn('cheques', 'id_sucursal')) {
            if (!empty($data['cuenta_id'])) {
                $cuenta = DB::table('cuentas_bancarias')->where('id', $data['cuenta_id'])->first();
                if ($cuenta && property_exists($cuenta, 'id_sucursal')) {
                    $data['id_sucursal'] = $cuenta->id_sucursal;
                } else {
                    $data['id_sucursal'] = $cuenta->id_sucursal ?? null;
                }
            }
        } else {
            if (isset($data['id_sucursal'])) unset($data['id_sucursal']);
        }

        $cheque->update($data);

        // Solución alternativa determinística (sin heurísticas): upsert/soft-delete
        try {
            $newEstado = strtolower(trim((string)($cheque->estado ?? '')));
            if ($prevEstado !== 'cobrado' && $newEstado === 'cobrado') {
                $this->upsertMovimientoBancoPorCheque($cheque);
            }
            if ($prevEstado === 'cobrado' && $newEstado !== 'cobrado') {
                $this->softDeleteMovimientoBancoPorCheque($cheque);
            }
        } catch (\Throwable $e) {
            Log::error('ChequeController.update: error al gestionar movimiento banco (alt)', [
                'message' => $e->getMessage(),
                'cheque_id' => $cheque->id ?? null,
            ]);
        }

        return response()->json(['data' => $cheque]);
    }

    public function destroy($id)
    {
        $cheque = Cheque::find($id);
        if (!$cheque) {
            return response()->json(['message' => 'Cheque no encontrado'], 404);
        }

        // Bloquear eliminación si proviene de una venta
        $obs = (string)($cheque->observaciones ?? '');
        if (stripos($obs, 'origen:venta') !== false) {
            return response()->json([
                'message' => 'Este cheque proviene de una venta y no se puede eliminar desde el módulo de Cheques. Debe gestionarse desde Ventas (solo si está Pendiente).',
                'code' => 'CHEQUE_DE_VENTA_NO_ELIMINABLE',
            ], 409);
        }

        $cheque->delete();
        return response()->json(['message' => 'Cheque anulado/eliminado']);
    }

    public function cobrar(Request $request, $id)
    {
        $cheque = Cheque::find($id);
        if (!$cheque) {
            return response()->json(['message' => 'Cheque no encontrado'], 404);
        }

        // Si ya está cobrado, no repetir movimiento
        if (strtolower(trim((string)$cheque->estado)) === 'cobrado') {
            return response()->json(['data' => $cheque]);
        }

        // Cambiar estado a Cobrado
        $cheque->estado = 'Cobrado';
        if ($request->filled('fecha_cobro')) {
            $cheque->fecha_cobro = $request->get('fecha_cobro');
        }
        $cheque->save();

        // Registrar movimiento bancario de forma determinística
        try {
            $this->upsertMovimientoBancoPorCheque($cheque);
        } catch (\Throwable $e) {
            Log::error('ChequeController.cobrar: error al gestionar movimiento banco (alt)', [
                'message' => $e->getMessage(),
                'cheque_id' => $cheque->id ?? null,
            ]);
        }

        return response()->json(['data' => $cheque]);
    }

    public function restore($id)
    {
        $cheque = Cheque::withTrashed()->find($id);
        if (!$cheque) {
            return response()->json(['message' => 'Cheque no encontrado'], 404);
        }

        if ($cheque->trashed()) {
            $cheque->restore();
        }

        // Devolver el registro restaurado
        $restored = Cheque::find($id);
        return response()->json(['data' => $restored]);
    }
}
