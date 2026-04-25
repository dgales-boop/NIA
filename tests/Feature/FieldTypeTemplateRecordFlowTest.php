<?php

namespace Tests\Feature;

use App\Models\FieldType;
use App\Models\User;
use Database\Seeders\FieldTypeSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class FieldTypeTemplateRecordFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $encoderUser;

    protected function setUp(): void
    {
        parent::setUp();

        Artisan::call('route:clear');
        $this->withoutMiddleware(PreventRequestForgery::class);

        $this->seed(FieldTypeSeeder::class);

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->encoderUser = User::factory()->create([
            'role' => 'encoder',
        ]);
    }

    public function test_can_list_seeded_field_types(): void
    {
        $response = $this->getJson('/field-types');

        $response
            ->assertOk()
            ->assertJsonCount(6)
            ->assertJsonFragment(['key' => 'short_text']);
    }

    public function test_can_create_template_with_valid_field_type_reference(): void
    {
        $fieldType = FieldType::query()->where('key', 'short_text')->firstOrFail();

        $response = $this->postJson('/templates', [
            'name' => 'Maintenance Logs',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'location',
                        'label' => 'Location',
                        'required' => true,
                        'field_type_id' => $fieldType->id,
                    ],
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('schema.fields.0.field_type_id', $fieldType->id)
            ->assertJsonPath('schema.fields.0.field_type_key', 'short_text')
            ->assertJsonPath('schema.fields.0.base_type', 'text');
    }

    public function test_rejects_template_with_invalid_field_type_reference(): void
    {
        $response = $this->postJson('/templates', [
            'name' => 'Invalid Template',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'location',
                        'label' => 'Location',
                        'required' => true,
                        'field_type_id' => 999999,
                    ],
                ],
            ],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['schema.fields.0.field_type_id']);
    }

    public function test_admin_can_create_field_type(): void
    {
        $response = $this
            ->actingAs($this->adminUser)
            ->postJson('/field-types', [
                'name' => 'Water Level Number',
                'key' => 'water_level_number',
                'base_type' => 'number',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('key', 'water_level_number');
    }

    public function test_guest_cannot_create_field_type(): void
    {
        $response = $this->postJson('/field-types', [
            'name' => 'Unauthorized Type',
            'key' => 'unauthorized_type',
            'base_type' => 'text',
        ]);

        $response->assertStatus(401);
    }

    public function test_encoder_cannot_create_field_type(): void
    {
        $response = $this
            ->actingAs($this->encoderUser)
            ->postJson('/field-types', [
                'name' => 'Encoder Type',
                'key' => 'encoder_type',
                'base_type' => 'text',
            ]);

        $response->assertStatus(403);
    }

    public function test_rejects_record_with_missing_required_field(): void
    {
        $fieldType = FieldType::query()->where('key', 'short_text')->firstOrFail();

        $templateResponse = $this->postJson('/templates', [
            'name' => 'Required Test',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'location',
                        'label' => 'Location',
                        'required' => true,
                        'field_type_id' => $fieldType->id,
                    ],
                ],
            ],
        ]);

        $templateId = $templateResponse->json('id');

        $response = $this->postJson('/records', [
            'template_id' => $templateId,
            'data' => [],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['data.location']);
    }

    public function test_rejects_record_with_unknown_key(): void
    {
        $fieldType = FieldType::query()->where('key', 'short_text')->firstOrFail();

        $templateResponse = $this->postJson('/templates', [
            'name' => 'Unknown Key Test',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'location',
                        'label' => 'Location',
                        'required' => false,
                        'field_type_id' => $fieldType->id,
                    ],
                ],
            ],
        ]);

        $templateId = $templateResponse->json('id');

        $response = $this->postJson('/records', [
            'template_id' => $templateId,
            'data' => [
                'other' => 'x',
            ],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['data']);
    }

    public function test_can_deactivate_field_type(): void
    {
        $fieldType = FieldType::query()->where('key', 'short_text')->firstOrFail();

        $response = $this
            ->actingAs($this->adminUser)
            ->postJson('/field-types/'.$fieldType->id.'/deactivate');

        $response
            ->assertOk()
            ->assertJsonPath('is_active', false);
    }

    public function test_rejects_select_value_not_in_allowed_options(): void
    {
        $fieldType = FieldType::query()->where('key', 'dropdown_basic')->firstOrFail();

        $templateResponse = $this->postJson('/templates', [
            'name' => 'Select Test',
            'schema' => [
                'fields' => [
                    [
                        'key' => 'status',
                        'label' => 'Status',
                        'required' => true,
                        'field_type_id' => $fieldType->id,
                    ],
                ],
            ],
        ]);

        $templateId = $templateResponse->json('id');

        $response = $this->postJson('/records', [
            'template_id' => $templateId,
            'data' => [
                'status' => 'Invalid Option',
            ],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['data.status']);
    }
}
