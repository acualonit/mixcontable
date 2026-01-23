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

        // Si el cheque se creó con estado 'Cobrado', registrar inmediatamente el movimiento bancario
        try {
            $estadoCreado = strtolower(trim((string)($cheque->estado ?? '')));
            if ($estadoCreado === 'cobrado') {
                try {
                    $this->upsertMovimientoBancoPorCheque($cheque);
                } catch (\Throwable $e) {
                    Log::error('ChequeController.store: error al crear movimiento banco inmediatamente tras creación', ['message' => $e->getMessage(), 'cheque_id' => $cheque->id ?? null]);
                }
            }
        } catch (\Throwable $__) {
            // no bloquear creación si falla la verificación
        }

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

    // Nuevo: devolver movimientos bancarios relacionados con un cheque
    public function movimientos($id)
    {
        try {
            if (!Schema::hasTable('movimientos_banco')) {
                return response()->json(['data' => []]);
            }

            $cols = Schema::getColumnListing('movimientos_banco');
            $query = DB::table('movimientos_banco');

            // Si existe columna cheque_id, usarla
            if (in_array('cheque_id', $cols, true)) {
                $query->where('cheque_id', (int)$id);
            } else {
                // Buscar por patrones en referencia u observaciones
                $refPattern = '%CHEQUE:' . (string)$id . '%';
                $obsPattern = '%CHEQUE_ID:' . (string)$id . '%';
                $query->where(function($q) use ($refPattern, $obsPattern) {
                    if (Schema::hasColumn('movimientos_banco', 'referencia')) {
                        $q->orWhere('referencia', 'like', $refPattern);
                    }
                    if (Schema::hasColumn('movimientos_banco', 'observaciones')) {
                        $q->orWhere('observaciones', 'like', $obsPattern);
                    }
                });
            }

            $movs = $query->orderByDesc('id')->get();
            return response()->json(['data' => $movs]);
        } catch (\Throwable $e) {
            Log::error('ChequeController.movimientos: error buscando movimientos para cheque', ['cheque_id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['data' => []]);
        }
    }

    /**
     * Crear o reactivar movimiento bancario para un cheque usando columnas reales.
     * Reglas:
     * - Si existe movimiento activo para cheque_id: actualizar datos.
     * - Si existe solo soft-deleted: reactivar (deleted_at = NULL) y actualizar.
     * - Si no existe: insertar.
     */
    private function upsertMovimientoBancoPorCheque(Cheque $cheque): void
    {        if (!Schema::hasTable('movimientos_banco')) return;

        $cols = Schema::getColumnListing('movimientos_banco');
        // columnas mínimas recomendadas: cuenta_id, fecha, monto, tipo_movimiento
        // No abortar si faltan columnas; intentaremos insertar/actualizar usando las columnas disponibles.
        $recommended = ['cuenta_id', 'fecha', 'monto', 'tipo_movimiento'];
        foreach ($recommended as $r) {
            if (!in_array($r, $cols, true)) {
                Log::info('ChequeController: movimientos_banco no tiene columna recomendada, se continuará usando fallback', ['missing' => $r, 'cols' => $cols]);
            }
        }

        // advertir si no existe columna cheque_id pero no abortar: usaremos referencia/observaciones como fallback
        $hasChequeIdCol = in_array('cheque_id', $cols, true);
        if (!$hasChequeIdCol) {
            Log::info('ChequeController: movimientos_banco no tiene columna cheque_id, se usará referencia/observaciones como fallback', ['cols' => $cols]);
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
            // incluir tag con id de cheque para trazabilidad cuando no exista cheque_id
            $obs = trim((string)($cheque->observaciones ?? ''));
            $obsTag = 'CHEQUE_ID:' . (string)$cheque->id;
            $data['observaciones'] = $obs ? ($obs . ' | ' . $obsTag) : $obsTag;
        }
        if (in_array('referencia', $cols, true)) {
            // preferir número de cheque como referencia, si no hay, dejar CHEQUE:<id>
            $data['referencia'] = (string)($cheque->numero_cheque ?? 'CHEQUE:' . (string)$cheque->id);
        }
        if (in_array('user_id', $cols, true)) {
            $authId = auth()->id();
            if ($authId) $data['user_id'] = $authId;
        }
        if (in_array('updated_at', $cols, true)) $data['updated_at'] = now();
        if (in_array('deleted_at', $cols, true)) $data['deleted_at'] = null;

        // Elegir registro a afectar: primero activo, si no, el último eliminado
        $targetId = null;
        try {
            if ($hasChequeIdCol) {
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
            } else {
                // buscar por referencia o observaciones que contengan el identificador del cheque
                if (in_array('referencia', $cols, true)) {
                    $targetId = DB::table('movimientos_banco')
                        ->where('referencia', 'like', '%CHEQUE:' . (string)$cheque->id . '%')
                        ->when(in_array('deleted_at', $cols, true), fn($q) => $q->whereNull('deleted_at'))
                        ->value('id');
                }
                if (!$targetId && in_array('observaciones', $cols, true)) {
                    $targetId = DB::table('movimientos_banco')
                        ->where('observaciones', 'like', '%CHEQUE_ID:' . (string)$cheque->id . '%')
                        ->when(in_array('deleted_at', $cols, true), fn($q) => $q->whereNull('deleted_at'))
                        ->value('id');
                }
            }
        } catch (\Throwable $__) {
            // ignore lookup errors
            $targetId = null;
        }

        if ($targetId) {
            // Si el movimiento existe, detectar si proviene de CxC y restringir campos a actualizar
            try {
                $mov = DB::table('movimientos_banco')->where('id', (int)$targetId)->first();
                $isFromCxc = false;
                if ($mov) {
                    $movObs = strtolower((string)($mov->observaciones ?? $mov->observacion ?? ''));
                    $movRef = strtolower((string)($mov->referencia ?? $mov->partida ?? $mov->reference ?? ''));
                    if (strpos($movObs, 'cxc_id:') !== false || strpos($movObs, 'origen:cxc') !== false || strpos($movRef, 'cxc_id:') !== false) {
                        $isFromCxc = true;
                    }
                }

                if ($isFromCxc) {
                    // Solo permitir actualizar fecha (y updated_at / user_id si existe)
                    $update = [];
                    if (in_array('fecha', $cols, true) && isset($data['fecha'])) $update['fecha'] = $data['fecha'];
                    if (in_array('updated_at', $cols, true)) $update['updated_at'] = now();
                    if (in_array('user_id', $cols, true) && isset($data['user_id'])) $update['user_id'] = $data['user_id'];

                    if (!empty($update)) {
                        Log::info('ChequeController: actualización limitada de movimiento_banco por cheque (CXC origen)',['id' => $targetId, 'cheque_id' => $cheque->id, 'update' => $update]);
                        DB::table('movimientos_banco')->where('id', (int)$targetId)->update($update);
                    } else {
                        Log::info('ChequeController: no hay campos permitidos para actualizar movimiento_banco de CxC', ['id' => $targetId, 'cheque_id' => $cheque->id]);
                    }
                    return;
                }

                Log::info('ChequeController: update movimiento_banco por cheque', ['id' => $targetId, 'cheque_id' => $cheque->id]);
                DB::table('movimientos_banco')->where('id', (int)$targetId)->update($data);
                return;
            } catch (\Throwable $e) {
                Log::error('ChequeController: error actualizando movimiento_banco por cheque', ['error' => $e->getMessage(), 'cheque_id' => $cheque->id, 'targetId' => $targetId]);
                return;
            }
        }

        // Insert
        if (in_array('created_at', $cols, true)) $data['created_at'] = now();
        // si la tabla tiene cheque_id, añadir; si no, mantener referencia/observaciones generadas arriba
        if ($hasChequeIdCol) $data['cheque_id'] = (int)$cheque->id;
        Log::info('ChequeController: insert movimiento_banco por cheque', ['cheque_id' => $cheque->id]);
        DB::table('movimientos_banco')->insert($data);
    }

    private function softDeleteMovimientoBancoPorCheque(Cheque $cheque): void
    {
        if (!Schema::hasTable('movimientos_banco')) return;
        $cols = Schema::getColumnListing('movimientos_banco');
        $hasChequeIdCol = in_array('cheque_id', $cols, true);
        if (!$hasChequeIdCol && !in_array('deleted_at', $cols, true)) return;

        $update = ['deleted_at' => now()];
        if (in_array('updated_at', $cols, true)) $update['updated_at'] = now();

        if ($hasChequeIdCol) {
            // Seleccionar movimientos que NO provienen de CxC
            $movs = DB::table('movimientos_banco')->where('cheque_id', (int)$cheque->id)->get();
            foreach ($movs as $m) {
                $mObs = strtolower((string)($m->observaciones ?? $m->observacion ?? ''));
                $mRef = strtolower((string)($m->referencia ?? $m->partida ?? $m->reference ?? ''));
                if (strpos($mObs, 'cxc_id:') !== false || strpos($mObs, 'origen:cxc') !== false || strpos($mRef, 'cxc_id:') !== false) {
                    Log::info('ChequeController.softDelete: salto soft-delete de movimiento proveniente de CxC', ['mov_id' => $m->id, 'cheque_id' => $cheque->id]);
                    continue;
                }
                DB::table('movimientos_banco')->where('id', $m->id)->update($update);
            }
            return;
        }

        // fallback: buscar por tag en observaciones o referencia, y excluir los que provienen de CxC
        try {
            if (in_array('observaciones', $cols, true)) {
                $rows = DB::table('movimientos_banco')->where('observaciones', 'like', '%CHEQUE_ID:' . (string)$cheque->id . '%')->get();
                foreach ($rows as $r) {
                    $obs = strtolower((string)($r->observaciones ?? ''));
                    if (strpos($obs, 'cxc_id:') !== false || strpos($obs, 'origen:cxc') !== false) {
                        Log::info('ChequeController.softDelete: salto soft-delete de movimiento proveniente de CxC (fallback)', ['mov_id' => $r->id, 'cheque_id' => $cheque->id]);
                        continue;
                    }
                    DB::table('movimientos_banco')->where('id', $r->id)->update($update);
                }
            }
            if (in_array('referencia', $cols, true)) {
                $rows = DB::table('movimientos_banco')->where('referencia', 'like', '%CHEQUE:' . (string)$cheque->id . '%')->get();
                foreach ($rows as $r) {
                    $ref = strtolower((string)($r->referencia ?? ''));
                    $obs = strtolower((string)($r->observaciones ?? ''));
                    if (strpos($obs, 'cxc_id:') !== false || strpos($obs, 'origen:cxc') !== false || strpos($ref, 'cxc_id:') !== false) {
                        Log::info('ChequeController.softDelete: salto soft-delete de movimiento proveniente de CxC (fallback 2)', ['mov_id' => $r->id, 'cheque_id' => $cheque->id]);
                        continue;
                    }
                    DB::table('movimientos_banco')->where('id', $r->id)->update($update);
                }
            }
        } catch (\Throwable $__) { /* ignore */ }
    }

    public function generarMovimientoPorCheque($chequeId)
    {
        try {
            $cheque = Cheque::withTrashed()->find($chequeId);
            if (!$cheque) {
                Log::warning('ChequeController.generarMovimientoPorCheque: cheque no encontrado', ['cheque_id' => $chequeId]);
                return;
            }

            // Si el cheque no está en estado Cobrado, marcarlo Cobrado
            try {
                $estado = strtolower(trim((string)($cheque->estado ?? '')));
                if ($estado !== 'cobrado') {
                    $cheque->estado = 'Cobrado';
                    if (Schema::hasColumn('cheques', 'fecha_cobro') && empty($cheque->fecha_cobro)) {
                        $cheque->fecha_cobro = now()->toDateString();
                    }
                    $cheque->save();
                }
            } catch (\Throwable $e) {
                Log::warning('ChequeController.generarMovimientoPorCheque: no se pudo actualizar estado de cheque', ['cheque_id' => $chequeId, 'error' => $e->getMessage()]);
            }

            // Invocar la rutina de upsert para movimientos bancarios
            try {
                $this->upsertMovimientoBancoPorCheque($cheque);
            } catch (\Throwable $e) {
                Log::error('ChequeController.generarMovimientoPorCheque: error creando movimiento banco', ['cheque_id' => $chequeId, 'error' => $e->getMessage()]);
            }
        } catch (\Throwable $e) {
            Log::error('ChequeController.generarMovimientoPorCheque: error inesperado', ['cheque_id' => $chequeId, 'error' => $e->getMessage()]);
        }
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

        // Detectar si el cheque tiene movimientos bancarios asociados que provienen de CxC
        $isFromCxc = false;
        try {
            if (Schema::hasTable('movimientos_banco')) {
                $mbCols = Schema::getColumnListing('movimientos_banco');
                $possible = null;
                if (in_array('cheque_id', $mbCols, true)) {
                    $possible = DB::table('movimientos_banco')->where('cheque_id', (int)$cheque->id)->first();
                }
                if (!$possible) {
                    // buscar por tags en referencia/observaciones
                    $q = DB::table('movimientos_banco');
                    $q->where(function($q2) use ($cheque) {
                        if (Schema::hasColumn('movimientos_banco', 'referencia')) $q2->orWhere('referencia', 'like', '%CHEQUE:' . (string)$cheque->id . '%');
                        if (Schema::hasColumn('movimientos_banco', 'observaciones')) $q2->orWhere('observaciones', 'like', '%CHEQUE_ID:' . (string)$cheque->id . '%');
                    });
                    $possible = $q->first();
                }
                if ($possible) {
                    $poObs = strtolower((string)($possible->observaciones ?? $possible->observacion ?? ''));
                    $poRef = strtolower((string)($possible->referencia ?? $possible->partida ?? $possible->reference ?? ''));
                    if (strpos($poObs, 'cxc_id:') !== false || strpos($poObs, 'origen:cxc') !== false || strpos($poRef, 'cxc_id:') !== false) {
                        $isFromCxc = true;
                    }
                }
            }
        } catch (\Throwable $e) { /* ignore detection errors */ }

        // Si el cheque proviene de una venta, permitir editar SOLO fecha_cobro (y estado/user_id si aplica)
        // Marca: "ORIGEN:VENTA" en observaciones.
        $obs = (string)($cheque->observaciones ?? '');
        $isFromVenta = stripos($obs, 'origen:venta') !== false;
        if ($isFromVenta || $isFromCxc) {
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

        // Sanitizar: no enviar claves con valor NULL para evitar violaciones de constraints (p.ej. cuenta_id NOT NULL)
        try {
            foreach ($data as $k => $v) {
                if ($v === null) unset($data[$k]);
                // evitar enviar cadena vacía para campos numéricos como cuenta_id
                if ($k === 'cuenta_id' && ($v === '' || $v === 0)) unset($data[$k]);
            }
        } catch (\Throwable $e) {
            // ignore sanitization errors
        }

        try {
            $cheque->update($data);
        } catch (\Throwable $e) {
            Log::error('ChequeController.update: error actualizando cheque', ['cheque_id' => $cheque->id ?? null, 'error' => $e->getMessage(), 'payload' => $data]);
            return response()->json(['message' => 'Error al actualizar cheque: datos inválidos o constraints en la BD', 'error' => $e->getMessage()], 422);
        }

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

        // Nuevo: bloquear eliminación si existen movimientos bancarios asociados que provienen de CxC
        try {
            if (Schema::hasTable('movimientos_banco')) {
                $mbCols = Schema::getColumnListing('movimientos_banco');
                $q = DB::table('movimientos_banco');
                if (in_array('cheque_id', $mbCols, true)) {
                    $q->where('cheque_id', (int)$id);
                } else {
                    if (Schema::hasColumn('movimientos_banco', 'referencia')) $q->orWhere('referencia', 'like', '%CHEQUE:' . (string)$id . '%');
                    if (Schema::hasColumn('movimientos_banco', 'observaciones')) $q->orWhere('observaciones', 'like', '%CHEQUE_ID:' . (string)$id . '%');
                }
                $mv = $q->first();
                if ($mv) {
                    $mObs = strtolower((string)($mv->observaciones ?? $mv->observacion ?? ''));
                    $mRef = strtolower((string)($mv->referencia ?? $mv->partida ?? $mv->reference ?? ''));
                    if (strpos($mObs, 'cxc_id:') !== false || strpos($mObs, 'origen:cxc') !== false || strpos($mRef, 'cxc_id:') !== false) {
                        return response()->json([
                            'message' => 'Este cheque está vinculado a un pago de CxC y no se puede eliminar desde Cheques.',
                            'code' => 'CHEQUE_DE_CXC_NO_ELIMINABLE'
                        ], 409);
                    }
                }
            }
        } catch (\Throwable $e) { /* ignore detection errors */ }

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
