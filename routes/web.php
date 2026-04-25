<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EntryController;
use App\Http\Controllers\FieldTypes\FieldTypeController;
use App\Http\Controllers\OrgUnitController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RecordController;
use App\Http\Controllers\TemplateController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

// Auth Routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/me', [AuthController::class, 'me']);

// Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Org Units (Read Only for everyone)
    Route::get('/org-units', [OrgUnitController::class, 'index']);
    Route::get('/org-units/{id}', [OrgUnitController::class, 'show']);
    Route::get('/org-units/{id}/children', [OrgUnitController::class, 'children']);

    // Projects
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);

    // Templates & Field Types (Read Only for everyone)
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::get('/field-types', [FieldTypeController::class, 'index']);

    // Entries
    Route::get('/entries', [EntryController::class, 'index']);
    Route::post('/entries', [EntryController::class, 'store']); // Encoders can create Entries
    Route::get('/entries/{id}', [EntryController::class, 'show']);

    // Records
    Route::get('/records', [RecordController::class, 'index']);
    Route::post('/records', [RecordController::class, 'store']); // Encoders can create records

    // --- Admin Only Routes ---
    Route::middleware('role:admin')->group(function () {
        // Form/Template management
        Route::post('/templates', [TemplateController::class, 'store']);
        Route::post('/field-types', [FieldTypeController::class, 'store']);
        Route::post('/field-types/{fieldType}/deactivate', [FieldTypeController::class, 'deactivate']);

        // Project management
        Route::post('/projects', [ProjectController::class, 'store']);

        // Entry status management
        Route::post('/entries/{id}/close', [EntryController::class, 'close']);
        Route::post('/entries/{id}/reopen', [EntryController::class, 'reopen']);
    });
});
