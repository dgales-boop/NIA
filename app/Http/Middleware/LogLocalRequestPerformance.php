<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Logs request duration, query count, and slow queries. Only for APP_ENV=local
 * when config app.local_perf_log is true. Does not log request body or bindings.
 */
class LogLocalRequestPerformance
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('app.local_perf_log') || ! app()->environment('local')) {
            return $next($request);
        }

        $started = microtime(true);
        $connection = DB::connection();
        $connection->enableQueryLog();

        try {
            return $next($request);
        } finally {
            $log = $connection->getQueryLog();
            $connection->disableQueryLog();

            $durationMs = (microtime(true) - $started) * 1000;
            $totalQueryTime = array_sum(array_column($log, 'time'));
            $slowThreshold = (float) config('app.local_perf_slow_query_ms', 100);
            $slow = array_filter($log, static fn (array $q): bool => $q['time'] >= $slowThreshold);

            Log::channel(config('app.local_perf_log_channel', 'stack'))->debug('request_perf', [
                'method' => $request->method(),
                'path' => $request->path(),
                'route' => $request->route()?->getName(),
                'duration_ms' => round($durationMs, 2),
                'query_count' => count($log),
                'query_time_ms' => round($totalQueryTime, 2),
                'memory_peak_mb' => round(memory_get_peak_usage(true) / 1048576, 2),
                'slow_queries' => array_map(
                    static function (array $q): array {
                        return [
                            'time_ms' => round($q['time'], 2),
                            'sql' => Str::limit($q['query'], 500),
                        ];
                    },
                    array_values($slow),
                ),
            ]);
        }
    }
}
