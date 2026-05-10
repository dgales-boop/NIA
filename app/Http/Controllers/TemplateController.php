<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTemplateRequest;
use App\Http\Requests\UpdateTemplateRequest;
use App\Services\TemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function __construct(private readonly TemplateService $templateService) {}

    public function index(Request $request): JsonResponse
    {
        if ($request->boolean('for_dropdown')) {
            return response()->json($this->templateService->listSummaries());
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
            $this->templateService->listSummariesPaginated($search, $perPage, $page),
        );
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->templateService->find($id));
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $template = $this->templateService->create($request->validated());

        return response()->json($template, 201);
    }

    public function update(UpdateTemplateRequest $request, int $id): JsonResponse
    {
        $template = $this->templateService->update($id, $request->validated());

        return response()->json($template);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->templateService->destroy($id);

        return response()->json(null, 204);
    }
}
