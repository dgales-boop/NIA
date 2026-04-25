<?php

namespace App\Http\Controllers;

use App\Services\EntryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EntryController extends Controller
{
    public function __construct(private readonly EntryService $entryService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $projectId = $request->has('project_id')
            ? (int) $request->input('project_id')
            : null;

        $status = $request->input('status');

        return response()->json($this->entryService->list($projectId, $status));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'template_id' => ['required', 'integer', 'exists:templates,id'],
        ]);

        $validated['created_by'] = Auth::id();

        $entry = $this->entryService->create($validated);

        return response()->json($entry, 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->entryService->find($id));
    }

    public function close(int $id): JsonResponse
    {
        $entry = $this->entryService->close($id);

        return response()->json($entry);
    }

    public function reopen(int $id): JsonResponse
    {
        $entry = $this->entryService->reopen($id);

        return response()->json($entry);
    }
}
