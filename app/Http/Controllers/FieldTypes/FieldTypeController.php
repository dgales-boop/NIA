<?php

namespace App\Http\Controllers\FieldTypes;

use App\Http\Controllers\Controller;
use App\Http\Requests\FieldTypes\StoreFieldTypeRequest;
use App\Models\FieldType;
use App\Services\FieldTypes\FieldTypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FieldTypeController extends Controller
{
    public function __construct(private readonly FieldTypeService $fieldTypeService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $includeInactive = filter_var($request->query('include_inactive', false), FILTER_VALIDATE_BOOL);

        $fieldTypes = $includeInactive
            ? $this->fieldTypeService->listAll()
            : $this->fieldTypeService->listActive();

        return response()->json($fieldTypes);
    }

    public function store(StoreFieldTypeRequest $request): JsonResponse
    {
        $fieldType = $this->fieldTypeService->create($request->validated());

        return response()->json($fieldType, 201);
    }

    public function deactivate(FieldType $fieldType): JsonResponse
    {
        $deactivated = $this->fieldTypeService->deactivate($fieldType);

        return response()->json($deactivated);
    }
}
