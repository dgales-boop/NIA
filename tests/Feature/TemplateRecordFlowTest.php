<?php

namespace Tests\Feature;

use App\Models\Entry;
use App\Models\Project;
use App\Models\Record;
use App\Models\Template;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class TemplateRecordFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;

    private User $encoderUser;

    protected function setUp(): void
    {
        parent::setUp();

        Artisan::call('route:clear');
        $this->withoutMiddleware(PreventRequestForgery::class);

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->encoderUser = User::factory()->create([
            'role' => 'encoder',
        ]);
    }

    public function test_admin_can_create_template_with_base_types(): void
    {
        $response = $this->actingAs($this->adminUser)->postJson('/templates', [
            'name' => 'Maintenance Logs',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'location',
                        'label' => 'Location',
                        'required' => true,
                        'base_type' => 'text',
                        'max' => 500,
                    ],
                    [
                        'key' => 'amount',
                        'label' => 'Amount',
                        'required' => false,
                        'base_type' => 'number',
                    ],
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('schema.fields.0.base_type', 'text')
            ->assertJsonPath('schema.fields.0.max', 500)
            ->assertJsonPath('schema.fields.1.base_type', 'number');
    }

    public function test_rejects_template_with_invalid_base_type(): void
    {
        $response = $this->actingAs($this->adminUser)->postJson('/templates', [
            'name' => 'Bad',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'x',
                        'label' => 'X',
                        'required' => false,
                        'base_type' => 'select',
                    ],
                ],
            ],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['schema.fields.0.base_type']);
    }

    public function test_rejects_max_length_on_non_text_column(): void
    {
        $response = $this->actingAs($this->adminUser)->postJson('/templates', [
            'name' => 'Bad Max',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'n',
                        'label' => 'N',
                        'required' => false,
                        'base_type' => 'number',
                        'max' => 100,
                    ],
                ],
            ],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['schema.fields.0.max']);
    }

    public function test_rejects_record_with_entry_template_mismatch(): void
    {
        $t1 = $this->createTemplate('Form A');
        $t2 = $this->createTemplate('Form B');
        $project = Project::query()->create([
            'name' => $this->uniqueProjectName('mismatch'),
            'description' => null,
            'created_by' => $this->adminUser->id,
        ]);
        $entry = Entry::query()->create([
            'title' => 'E',
            'project_id' => $project->id,
            'template_id' => $t1->id,
            'status' => 'open',
            'created_by' => $this->encoderUser->id,
        ]);

        $response = $this->actingAs($this->encoderUser)->postJson('/records', [
            'template_id' => $t2->id,
            'entry_id' => $entry->id,
            'data' => ['loc' => 'x'],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['entry_id']);
    }

    public function test_rejects_record_text_longer_than_schema_max(): void
    {
        $template = $this->actingAs($this->adminUser)->postJson('/templates', [
            'name' => 'Short text form',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'note',
                        'label' => 'Note',
                        'required' => false,
                        'base_type' => 'text',
                        'max' => 255,
                    ],
                ],
            ],
        ])->json();

        $response = $this->actingAs($this->encoderUser)->postJson('/records', [
            'template_id' => $template['id'],
            'data' => [
                'note' => str_repeat('a', 300),
            ],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['data.note']);
    }

    public function test_cannot_update_template_schema_when_records_exist(): void
    {
        $template = $this->createTemplate('Locked');
        Record::query()->create([
            'template_id' => $template->id,
            'entry_id' => null,
            'data' => ['loc' => 'here'],
        ]);

        $response = $this->actingAs($this->adminUser)->putJson('/templates/'.$template->id, [
            'name' => 'Locked Renamed',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'loc',
                        'label' => 'Location',
                        'required' => false,
                        'base_type' => 'text',
                    ],
                ],
            ],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['schema']);
    }

    public function test_admin_can_rename_template_when_records_exist(): void
    {
        $template = $this->createTemplate('Old');
        Record::query()->create([
            'template_id' => $template->id,
            'entry_id' => null,
            'data' => ['loc' => 'here'],
        ]);

        $response = $this->actingAs($this->adminUser)->putJson('/templates/'.$template->id, [
            'name' => 'New Name',
        ]);

        $response->assertOk()->assertJsonPath('name', 'New Name');
    }

    public function test_encoder_can_update_only_title_on_own_entry(): void
    {
        [$entry] = $this->createEntryWithContext();

        $ok = $this->actingAs($this->encoderUser)->putJson('/entries/'.$entry->id, [
            'title' => 'Updated Title',
        ]);
        $ok->assertOk()->assertJsonPath('title', 'Updated Title');

        $bad = $this->actingAs($this->encoderUser)->putJson('/entries/'.$entry->id, [
            'title' => 'X',
            'project_id' => $entry->project_id,
        ]);
        $bad->assertStatus(422);
    }

    public function test_encoder_cannot_update_another_users_entry(): void
    {
        [$entry] = $this->createEntryWithContext();

        $otherEncoder = User::factory()->create(['role' => 'encoder']);

        $response = $this->actingAs($otherEncoder)->putJson('/entries/'.$entry->id, [
            'title' => 'Hacked',
        ]);

        $response->assertForbidden();
    }

    public function test_cannot_delete_project_with_entries(): void
    {
        $project = Project::query()->create([
            'name' => $this->uniqueProjectName('delete-guard'),
            'description' => null,
            'created_by' => $this->adminUser->id,
        ]);
        $template = $this->createTemplate('T');
        Entry::query()->create([
            'title' => 'E',
            'project_id' => $project->id,
            'template_id' => $template->id,
            'status' => 'open',
            'created_by' => $this->encoderUser->id,
        ]);

        $response = $this->actingAs($this->adminUser)->deleteJson('/projects/'.$project->id);

        $response->assertStatus(422)->assertJsonValidationErrors(['project']);
    }

    public function test_bulk_store_saves_multiple_records(): void
    {
        [$entry,, $template] = $this->createEntryWithContext();

        $response = $this->actingAs($this->encoderUser)->postJson('/records/bulk-store', [
            'template_id' => $template->id,
            'entry_id' => $entry->id,
            'rows' => [
                ['loc' => 'North'],
                ['loc' => 'South'],
            ],
        ]);

        $response->assertCreated()->assertJsonPath('saved_count', 2);

        $this->assertSame(2, Record::query()->where('entry_id', $entry->id)->count());
    }

    public function test_bulk_store_rejects_more_than_500_rows(): void
    {
        [$entry,, $template] = $this->createEntryWithContext();

        $rows = [];
        for ($i = 0; $i < 501; $i++) {
            $rows[] = ['loc' => 'R'.$i];
        }

        $response = $this->actingAs($this->encoderUser)->postJson('/records/bulk-store', [
            'template_id' => $template->id,
            'entry_id' => $entry->id,
            'rows' => $rows,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['rows']);
        $this->assertSame(0, Record::query()->where('entry_id', $entry->id)->count());
    }

    public function test_encoder_can_update_saved_row_in_own_entry(): void
    {
        [$entry] = $this->createEntryWithContext();

        $this->actingAs($this->encoderUser)->postJson('/records/bulk-store', [
            'template_id' => $entry->template_id,
            'entry_id' => $entry->id,
            'rows' => [
                ['loc' => 'Before'],
            ],
        ])->assertCreated();

        $record = Record::query()->where('entry_id', $entry->id)->firstOrFail();

        $response = $this->actingAs($this->encoderUser)->putJson('/records/'.$record->id, [
            'data' => ['loc' => 'After'],
        ]);

        $response->assertOk()->assertJsonPath('data.loc', 'After');

        $record->refresh();
        $this->assertSame('After', $record->data['loc']);
    }

    public function test_cannot_update_record_when_entry_closed(): void
    {
        [$entry] = $this->createEntryWithContext();

        $this->actingAs($this->encoderUser)->postJson('/records/bulk-store', [
            'template_id' => $entry->template_id,
            'entry_id' => $entry->id,
            'rows' => [
                ['loc' => 'X'],
            ],
        ])->assertCreated();

        $entry->update(['status' => 'closed']);

        $record = Record::query()->where('entry_id', $entry->id)->firstOrFail();

        $response = $this->actingAs($this->encoderUser)->putJson('/records/'.$record->id, [
            'data' => ['loc' => 'Y'],
        ]);

        $response->assertForbidden();
    }

    public function test_bulk_store_validation_failure_does_not_partially_save(): void
    {
        $project = Project::query()->create([
            'name' => $this->uniqueProjectName('bulk-validation'),
            'description' => null,
            'created_by' => $this->adminUser->id,
        ]);
        $template = Template::query()->create([
            'name' => 'RequiredLoc',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'loc',
                        'label' => 'Location',
                        'required' => true,
                        'base_type' => 'text',
                        'max' => 2000,
                    ],
                ],
            ],
        ]);
        $entry = Entry::query()->create([
            'title' => 'E2',
            'project_id' => $project->id,
            'template_id' => $template->id,
            'status' => 'open',
            'created_by' => $this->encoderUser->id,
        ]);

        $before = Record::query()->where('entry_id', $entry->id)->count();
        $this->assertSame(0, $before);

        $response = $this->actingAs($this->encoderUser)->postJson('/records/bulk-store', [
            'template_id' => $template->id,
            'entry_id' => $entry->id,
            'rows' => [
                ['loc' => 'OK row'],
                ['loc' => ''],
            ],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['rows.1.loc']);
        $this->assertSame(0, Record::query()->where('entry_id', $entry->id)->count());
    }

    public function test_encoder_cannot_update_record_on_someone_elses_entry(): void
    {
        $project = Project::query()->create([
            'name' => $this->uniqueProjectName('foreign-entry'),
            'description' => null,
            'created_by' => $this->adminUser->id,
        ]);
        $template = $this->createTemplate('OtherForm');
        $entry = Entry::query()->create([
            'title' => 'Other entry',
            'project_id' => $project->id,
            'template_id' => $template->id,
            'status' => 'open',
            'created_by' => $this->adminUser->id,
        ]);

        $this->actingAs($this->adminUser)->postJson('/records/bulk-store', [
            'template_id' => $template->id,
            'entry_id' => $entry->id,
            'rows' => [
                ['loc' => 'Owned by admin'],
            ],
        ])->assertCreated();

        $record = Record::query()->where('entry_id', $entry->id)->firstOrFail();

        $response = $this->actingAs($this->encoderUser)->putJson('/records/'.$record->id, [
            'data' => ['loc' => 'Hacked'],
        ]);

        $response->assertForbidden();

        $record->refresh();
        $this->assertSame('Owned by admin', $record->data['loc']);
    }

    public function test_entries_index_filters_by_exported_status(): void
    {
        $project = Project::query()->create([
            'name' => $this->uniqueProjectName('export-filter'),
            'description' => null,
            'created_by' => $this->adminUser->id,
        ]);
        $template = $this->createTemplate('ExportFilterForm');
        $open = Entry::query()->create([
            'title' => 'Open E',
            'project_id' => $project->id,
            'template_id' => $template->id,
            'status' => 'open',
            'created_by' => $this->encoderUser->id,
        ]);
        $exported = Entry::query()->create([
            'title' => 'Exported E',
            'project_id' => $project->id,
            'template_id' => $template->id,
            'status' => 'exported',
            'created_by' => $this->encoderUser->id,
        ]);
        $closed = Entry::query()->create([
            'title' => 'Closed E',
            'project_id' => $project->id,
            'template_id' => $template->id,
            'status' => 'closed',
            'created_by' => $this->encoderUser->id,
        ]);

        $response = $this->actingAs($this->encoderUser)->getJson(
            '/entries?status=exported&per_page=100&page=1',
        );

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($exported->id, $ids);
        $this->assertNotContains($open->id, $ids);
        $this->assertNotContains($closed->id, $ids);
    }

    public function test_encoder_can_mark_own_entry_exported_idempotently(): void
    {
        [$entry] = $this->createEntryWithContext();

        $this->actingAs($this->encoderUser)
            ->postJson('/entries/'.$entry->id.'/mark-exported')
            ->assertOk()
            ->assertJsonPath('status', 'exported');

        $this->actingAs($this->encoderUser)
            ->postJson('/entries/'.$entry->id.'/mark-exported')
            ->assertOk()
            ->assertJsonPath('status', 'exported');
    }

    public function test_encoder_cannot_mark_exported_on_another_users_entry(): void
    {
        [$entry] = $this->createEntryWithContext();
        $other = User::factory()->create(['role' => 'encoder']);

        $this->actingAs($other)
            ->postJson('/entries/'.$entry->id.'/mark-exported')
            ->assertForbidden();
    }

    public function test_bulk_store_rejects_when_entry_not_open(): void
    {
        [$entry,, $template] = $this->createEntryWithContext();
        $entry->update(['status' => 'exported']);

        $response = $this->actingAs($this->encoderUser)->postJson('/records/bulk-store', [
            'template_id' => $template->id,
            'entry_id' => $entry->id,
            'rows' => [
                ['loc' => 'X'],
            ],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['entry_id']);
    }

    public function test_store_record_rejects_when_entry_not_open(): void
    {
        [$entry,, $template] = $this->createEntryWithContext();
        $entry->update(['status' => 'closed']);

        $response = $this->actingAs($this->encoderUser)->postJson('/records', [
            'template_id' => $template->id,
            'entry_id' => $entry->id,
            'data' => ['loc' => 'X'],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['entry_id']);
    }

    public function test_admin_close_rejected_when_entry_not_open(): void
    {
        [$entry] = $this->createEntryWithContext();
        $entry->update(['status' => 'exported']);

        $this->actingAs($this->adminUser)
            ->postJson('/entries/'.$entry->id.'/close')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_admin_can_reopen_exported_entry(): void
    {
        [$entry] = $this->createEntryWithContext();
        $entry->update(['status' => 'exported']);

        $this->actingAs($this->adminUser)
            ->postJson('/entries/'.$entry->id.'/reopen')
            ->assertOk()
            ->assertJsonPath('status', 'open');
    }

    private function createTemplate(string $name): Template
    {
        return Template::query()->create([
            'name' => $name,
            'schema' => [
                'fields' => [
                    [
                        'key' => 'loc',
                        'label' => 'Location',
                        'required' => false,
                        'base_type' => 'text',
                        'max' => 2000,
                    ],
                ],
            ],
        ]);
    }

    /**
     * @return array{0: Entry, 1: Project, 2: Template}
     */
    private function createEntryWithContext(): array
    {
        $project = Project::query()->create([
            'name' => $this->uniqueProjectName('entry-context'),
            'description' => null,
            'created_by' => $this->adminUser->id,
        ]);
        $template = $this->createTemplate('Form');
        $entry = Entry::query()->create([
            'title' => 'Original',
            'project_id' => $project->id,
            'template_id' => $template->id,
            'status' => 'open',
            'created_by' => $this->encoderUser->id,
        ]);

        return [$entry, $project, $template];
    }

    /** Avoid duplicate-looking rows if tests ever hit a persistent DB; never used by seeders. */
    private function uniqueProjectName(string $label): string
    {
        return 'TEST '.$label.' '.uniqid('', true);
    }
}
