<?php

namespace App\Http\Controllers;

use App\Services\OrgUnitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrgUnitController extends Controller
{
    public function __construct(private readonly OrgUnitService $orgUnitService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        if ($request->has('flat')) {
            return response()->json($this->orgUnitService->listAll());
        }

        return response()->json($this->orgUnitService->listTree());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:org_units,code'],
            'level_type' => ['required', 'in:region,imo,section'],
            'parent_id' => ['nullable', 'integer', 'exists:org_units,id'],
            'description' => ['nullable', 'string'],
        ]);

        $orgUnit = $this->orgUnitService->create($validated);

        return response()->json($orgUnit, 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->orgUnitService->find($id));
    }

    public function children(int $id): JsonResponse
    {
        return response()->json($this->orgUnitService->listChildren($id));
    }
}
