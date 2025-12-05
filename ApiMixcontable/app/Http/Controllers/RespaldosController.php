<?php

namespace App\Http\Controllers;

use App\Models\Respaldo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Spatie\DbDumper\Databases\MySql;
use Spatie\DbDumper\Databases\PostgreSql;

class RespaldosController extends Controller
{
    public function index()
    {
        $respaldos = Respaldo::with('usuario:id,name,email')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($respaldos);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo' => ['nullable', Rule::in(['manual', 'automatico'])],
        ]);

        $tipo = $data['tipo'] ?? 'manual';
        $usuarioId = optional($request->user())->id;

        try {
            $ruta = $this->dumpDatabase();

            $respaldo = Respaldo::create([
                'tipo' => $tipo,
                'archivo' => basename($ruta),
                'ruta' => $ruta,
                'estado' => 'COMPLETADO',
                'usuario_id' => $usuarioId,
                'detalles' => 'Respaldo generado correctamente',
            ]);

            return response()->json([
                'message' => 'Respaldo generado',
                'respaldo' => $respaldo->fresh('usuario'),
            ], 201);
        } catch (\Throwable $th) {
            $respaldo = Respaldo::create([
                'tipo' => $tipo,
                'estado' => 'FALLIDO',
                'usuario_id' => $usuarioId,
                'detalles' => $th->getMessage(),
            ]);

            return response()->json([
                'message' => 'No fue posible generar el respaldo',
                'error' => $th->getMessage(),
                'respaldo' => $respaldo,
            ], 500);
        }
    }

    public function download(Respaldo $respaldo)
    {
        if (!$respaldo->ruta || !Storage::disk('local')->exists($respaldo->ruta)) {
            return response()->json(['message' => 'Archivo no disponible'], 404);
        }

        return Storage::disk('local')->download(
            $respaldo->ruta,
            $respaldo->archivo ?? basename($respaldo->ruta)
        );
    }

    public function destroy(Respaldo $respaldo)
    {
        if ($respaldo->ruta) {
            Storage::disk('local')->delete($respaldo->ruta);
        }

        $respaldo->delete();

        return response()->json(['message' => 'Respaldo eliminado']);
    }

    public function restore(Request $request)
    {
        $request->validate([
            'archivo' => ['required', 'file'],
        ]);

        $path = $request->file('archivo')->store('backups/restaurados');

        return response()->json([
            'message' => 'Archivo cargado. Ejecuta la restauración manualmente desde el servidor.',
            'ruta' => $path,
        ]);
    }

    private function dumpDatabase(): string
    {
        $connection = config('database.default');
        $config = config("database.connections.$connection");
        $filename = 'backup-' . now()->format('Ymd-His') . '.sql';
        $relativePath = 'backups/' . $filename;
        $fullPath = storage_path('app/' . $relativePath);

        if (!is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        try {
            match ($config['driver'] ?? 'mysql') {
                'mysql' => $this->dumpMySql($config, $fullPath),
                'pgsql' => $this->dumpPostgres($config, $fullPath),
                'sqlite' => $this->dumpSqlite($config, $fullPath),
                default => throw new \RuntimeException('Driver de base de datos no soportado'),
            };
        } catch (\Throwable $th) {
            if (file_exists($fullPath)) {
                @unlink($fullPath);
            }

            throw $th;
        }

        return $relativePath;
    }

    private function dumpMySql(array $config, string $fullPath): void
    {
        MySql::create()
            ->setDbName($config['database'] ?? '')
            ->setUserName($config['username'] ?? '')
            ->setPassword($config['password'] ?? '')
            ->setHost($config['host'] ?? '127.0.0.1')
            ->setPort($config['port'] ?? 3306)
            ->dumpToFile($fullPath);
    }

    private function dumpPostgres(array $config, string $fullPath): void
    {
        PostgreSql::create()
            ->setDbName($config['database'] ?? '')
            ->setUserName($config['username'] ?? '')
            ->setPassword($config['password'] ?? '')
            ->setHost($config['host'] ?? '127.0.0.1')
            ->setPort($config['port'] ?? 5432)
            ->dumpToFile($fullPath);
    }

    private function dumpSqlite(array $config, string $fullPath): void
    {
        $databasePath = $config['database'] ?? database_path('database.sqlite');

        if (!file_exists($databasePath)) {
            throw new \RuntimeException('No se encontró el archivo de base de datos SQLite');
        }

        copy($databasePath, $fullPath);
    }
}
