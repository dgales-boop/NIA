<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EntryController;
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

    // Projects
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);

    // Templates (read for all authenticated users)
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::get('/templates/{id}', [TemplateController::class, 'show']);

    // Entries
    Route::get('/entries', [EntryController::class, 'index']);
    Route::post('/entries', [EntryController::class, 'store']);
    Route::get('/entries/{id}', [EntryController::class, 'show']);
    Route::put('/entries/{id}', [EntryController::class, 'update']);
    Route::delete('/entries/{id}', [EntryController::class, 'destroy']);
    Route::post('/entries/{id}/mark-exported', [EntryController::class, 'markExported']);

    // Records
    Route::get('/records', [RecordController::class, 'index']);
    Route::post('/records', [RecordController::class, 'store']);
    Route::post('/records/bulk-store', [RecordController::class, 'bulkStore']);
    Route::put('/records/{record}', [RecordController::class, 'update']);

    // --- Admin Only Routes ---
    Route::middleware('role:admin')->group(function () {
        Route::post('/templates', [TemplateController::class, 'store']);
        Route::put('/templates/{id}', [TemplateController::class, 'update']);
        Route::delete('/templates/{id}', [TemplateController::class, 'destroy']);

        Route::post('/projects', [ProjectController::class, 'store']);
        Route::put('/projects/{id}', [ProjectController::class, 'update']);
        Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

        Route::post('/entries/{id}/close', [EntryController::class, 'close']);
        Route::post('/entries/{id}/reopen', [EntryController::class, 'reopen']);
    });
});
