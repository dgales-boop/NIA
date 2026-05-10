<?php

namespace App\Http\Controllers;

use App\Models\Entry;
use App\Services\EntryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EntryController extends Controller
{
    public function __construct(private readonly EntryService $entryService) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => ['sometimes', 'nullable', 'integer', 'exists:projects,id'],
            'status' => ['sometimes', 'nullable', 'string', 'in:open,closed,exported'],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $projectId = isset($validated['project_id'])
            ? (int) $validated['project_id']
            : null;

        $status = isset($validated['status']) && $validated['status'] !== ''
            ? (string) $validated['status']
            : null;

        $search = isset($validated['search']) ? trim((string) $validated['search']) : '';
        $search = $search === '' ? null : $search;

        $perPage = (int) ($validated['per_page'] ?? 15);
        $page = isset($validated['page']) ? (int) $validated['page'] : null;

        return response()->json(
            $this->entryService->listPaginated($projectId, $status, $search, $perPage, $page),
        );
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

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $entry = Entry::query()->findOrFail($id);

        if ($user->role !== 'admin' && (int) $entry->created_by !== (int) $user->id) {
            abort(403);
        }

        if ($user->role === 'admin') {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'project_id' => ['sometimes', 'required', 'integer', 'exists:projects,id'],
                'template_id' => ['sometimes', 'required', 'integer', 'exists:templates,id'],
            ]);
        } else {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'project_id' => ['prohibited'],
                'template_id' => ['prohibited'],
            ]);
        }

        $updated = $this->entryService->update($id, $validated, $user);

        return response()->json($updated);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $entry = Entry::query()->findOrFail($id);

        if ($user->role !== 'admin' && (int) $entry->created_by !== (int) $user->id) {
            abort(403);
        }

        $this->entryService->destroy($id);

        return response()->json(null, 204);
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

    public function markExported(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $entry = Entry::query()->findOrFail($id);

        if ($user->role !== 'admin' && (int) $entry->created_by !== (int) $user->id) {
            abort(403);
        }

        $updated = $this->entryService->markExported($id);

        return response()->json($updated);
    }
}
