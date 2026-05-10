<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkStoreRecordsRequest;
use App\Http\Requests\StoreRecordRequest;
use App\Http\Requests\UpdateRecordRequest;
use App\Models\Record;
use App\Services\RecordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecordController extends Controller
{
    public function __construct(private readonly RecordService $recordService) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => ['required', 'integer', 'exists:templates,id'],
        ]);

        return response()->json($this->recordService->listByTemplate((int) $validated['template_id']));
    }

    public function store(StoreRecordRequest $request): JsonResponse
    {
        $record = $this->recordService->create($request->validated());

        return response()->json($record, 201);
    }

    public function bulkStore(BulkStoreRecordsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $records = $this->recordService->createMany(
            (int) $validated['template_id'],
            (int) $validated['entry_id'],
            $validated['rows'],
        );

        return response()->json([
            'records' => $records,
            'saved_count' => count($records),
        ], 201);
    }

    public function update(UpdateRecordRequest $request, Record $record): JsonResponse
    {
        $updated = $this->recordService->update($record->id, $request->validated()['data']);

        return response()->json($updated);
    }
}
