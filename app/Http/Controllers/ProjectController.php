<?php

namespace App\Http\Controllers;

use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $projectService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $orgUnitId = $request->has('org_unit_id')
            ? (int) $request->input('org_unit_id')
            : null;

        return response()->json($this->projectService->list($orgUnitId));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'org_unit_id' => ['required', 'integer', 'exists:org_units,id'],
        ]);

        $validated['created_by'] = Auth::id();

        $project = $this->projectService->create($validated);

        return response()->json($project, 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->projectService->find($id));
    }
}
