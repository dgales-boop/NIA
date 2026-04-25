<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTemplateRequest;
use App\Services\TemplateService;
use Illuminate\Http\JsonResponse;

class TemplateController extends Controller
{
    public function __construct(private readonly TemplateService $templateService)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json($this->templateService->listSummaries());
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $template = $this->templateService->create($request->validated());

        return response()->json($template, 201);
    }
}
