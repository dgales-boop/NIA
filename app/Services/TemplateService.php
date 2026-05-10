<?php

namespace App\Services;

use App\Http\Requests\StoreTemplateRequest;
use App\Models\Record;
use App\Models\Template;
use App\Support\LikePattern;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TemplateService
{
    public function create(array $payload): Template
    {
        $fields = $payload['schema']['fields'] ?? [];

        return Template::query()->create([
            'name' => $payload['name'],
            'schema' => [
                'fields' => $this->normalizeFields($fields),
            ],
        ]);
    }

    public function update(int $id, array $payload): Template
    {
        $template = Template::query()->findOrFail($id);

        if (array_key_exists('name', $payload)) {
            $template->name = $payload['name'];
        }

        if (array_key_exists('schema', $payload)) {
            if (Record::query()->where('template_id', $template->id)->exists()) {
                throw ValidationException::withMessages([
                    'schema' => ['Cannot change template columns while data rows exist for this template.'],
                ]);
            }

            $template->schema = [
                'fields' => $this->normalizeFields($payload['schema']['fields'] ?? []),
            ];
        }

        $template->save();

        return $template->fresh();
    }

    public function destroy(int $id): void
    {
        $template = Template::query()->findOrFail($id);

        if ($template->entries()->exists()) {
            throw ValidationException::withMessages([
                'template' => ['Cannot delete a template that is still used by budget entries.'],
            ]);
        }

        $template->delete();
    }

    public function find(int $id): Template
    {
        return Template::query()->findOrFail($id);
    }

    /**
     * Full summary list for entry modals (no pagination).
     *
     * @return Collection<int, array{id: int, name: string, updated_at: mixed, fields_count: int}>
     */
    public function listSummaries(): Collection
    {
        return $this->summariesBaseQuery()
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Template $t): array => $this->templateSummaryArray($t));
    }

    /**
     * Paginated summaries for the Templates admin screen with optional name search.
     */
    public function listSummariesPaginated(?string $search, int $perPage, ?int $page = null): LengthAwarePaginator
    {
        $query = $this->summariesBaseQuery()->orderByDesc('updated_at');

        $pattern = LikePattern::contains($search);
        if ($pattern !== null) {
            $query->where('name', 'like', $pattern);
        }

        return $query
            ->paginate($perPage, ['*'], 'page', $page)
            ->withQueryString()
            ->through(fn (Template $t): array => $this->templateSummaryArray($t));
    }

    /**
     * Base query for template list rows (lightweight fields_count without full schema when possible).
     */
    private function summariesBaseQuery(): Builder
    {
        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'sqlite'], true)) {
            // `schema` is a reserved word in MySQL; must be quoted in raw SQL.
            $expr = $driver === 'mysql'
                ? "COALESCE(JSON_LENGTH(JSON_EXTRACT(`schema`, '$.fields')), 0)"
                : "COALESCE(json_array_length(json_extract(`schema`, '$.fields')), 0)";

            return Template::query()
                ->select(['id', 'name', 'updated_at'])
                ->selectRaw($expr.' as fields_count');
        }

        return Template::query()->select(['id', 'name', 'schema', 'updated_at']);
    }

    /**
     * @return array{id: int, name: string, updated_at: mixed, fields_count: int}
     */
    private function templateSummaryArray(Template $t): array
    {
        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'sqlite'], true)) {
            $fieldsCount = (int) ($t->fields_count ?? 0);
        } else {
            $fieldsCount = count($t->schema['fields'] ?? []);
        }

        return [
            'id' => $t->id,
            'name' => $t->name,
            'updated_at' => $t->updated_at,
            'fields_count' => $fieldsCount,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $fields
     * @return array<int, array<string, mixed>>
     */
    private function normalizeFields(array $fields): array
    {
        $normalized = [];

        foreach ($fields as $field) {
            $baseType = $field['base_type'];
            $row = [
                'key' => $field['key'],
                'label' => $field['label'],
                'required' => (bool) ($field['required'] ?? false),
                'base_type' => $baseType,
            ];

            if ($baseType === 'text') {
                $max = isset($field['max']) ? (int) $field['max'] : StoreTemplateRequest::TEXT_MAX_DEFAULT;
                $max = max(StoreTemplateRequest::TEXT_MAX_MIN, min(StoreTemplateRequest::TEXT_MAX_CAP, $max));
                $row['max'] = $max;
            }

            $normalized[] = $row;
        }

        return $normalized;
    }
}
