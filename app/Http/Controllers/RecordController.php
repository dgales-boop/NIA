<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRecordRequest;
use App\Services\RecordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecordController extends Controller
{
    public function __construct(private readonly RecordService $recordService)
    {
    }

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
}
