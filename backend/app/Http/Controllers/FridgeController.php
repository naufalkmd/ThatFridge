<?php

namespace App\Http\Controllers;

use App\Http\Resources\FridgeResource;
use App\Models\Fridge;
use Illuminate\Http\Request;

class FridgeController extends Controller
{
    public function index(Request $request)
    {
        $fridges = $request->user()->fridges()->with('sections.items.product')->get();

        return FridgeResource::collection($fridges);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'style' => ['nullable', 'string', 'max:255'],
        ]);

        $fridge = $request->user()->fridges()->create($data);

        return new FridgeResource($fridge->load('sections.items.product'));
    }

    public function show(Request $request, Fridge $fridge)
    {
        $this->authorize('view', $fridge);

        return new FridgeResource($fridge->load('sections.items.product'));
    }

    public function update(Request $request, Fridge $fridge)
    {
        $this->authorize('update', $fridge);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'style' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $fridge->update($data);

        return new FridgeResource($fridge->load('sections.items.product'));
    }

    public function destroy(Request $request, Fridge $fridge)
    {
        $this->authorize('delete', $fridge);

        $fridge->delete();

        return response()->noContent();
    }
}
