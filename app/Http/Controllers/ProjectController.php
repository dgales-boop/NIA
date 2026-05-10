<?php

namespace App\Http\Controllers;

use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $projectService) {}

    public function index(Request $request): JsonResponse
    {
        if ($request->boolean('for_dropdown')) {
            return response()->json($this->projectService->listForDropdown());
        }

        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $search = isset($validated['search']) ? trim((string) $validated['search']) : '';
        $search = $search === '' ? null : $search;

        $perPage = (int) ($validated['per_page'] ?? 15);
        $page = isset($validated['page']) ? (int) $validated['page'] : null;

        return response()->json(
            $this->projectService->listPaginated($search, $perPage, $page),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $validated['created_by'] = Auth::id();

        $project = $this->projectService->create($validated);

        return response()->json($project, 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->projectService->find($id));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $project = $this->projectService->update($id, $validated);

        return response()->json($project);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->projectService->destroy($id);

        return response()->json(null, 204);
    }
}
