<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    public function test_can_login_and_fetch_auth_context(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => 'admin',
        ]);

        $login = $this->postJson('/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $login
            ->assertOk()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.role', 'admin');

        $me = $this->getJson('/auth/me');

        $me
            ->assertOk()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.email', 'admin@example.com');
    }

    public function test_invalid_login_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'encoder@example.com',
            'password' => 'password',
            'role' => 'encoder',
        ]);

        $response = $this->postJson('/auth/login', [
            'email' => 'encoder@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    public function test_logout_clears_session(): void
    {
        $user = User::factory()->create([
            'role' => 'encoder',
        ]);

        $this->actingAs($user)->postJson('/auth/logout')->assertOk();

        $this->getJson('/auth/me')->assertStatus(401);
    }
}
