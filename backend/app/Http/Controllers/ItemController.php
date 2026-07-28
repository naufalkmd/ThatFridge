<?php

namespace App\Http\Controllers;

use App\Http\Resources\ItemResource;
use App\Models\Item;
use App\Models\Section;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function store(Request $request, Section $section)
    {
        $this->authorize('update', $section);

        $data = $request->validate([
            'product_id' => ['nullable', 'exists:products,id'],
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'in:fridge,freezer,pantry'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'expiry_date' => ['nullable', 'date'],
            'shelf_life_days' => ['nullable', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'in:manual,barcode,receipt,photo,voice'],
        ]);

        $item = $section->items()->create($data);

        return new ItemResource($item->load('product'));
    }

    public function update(Request $request, Item $item)
    {
        $this->authorize('update', $item);

        $data = $request->validate([
            'product_id' => ['sometimes', 'nullable', 'exists:products,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'icon' => ['sometimes', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'in:fridge,freezer,pantry'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'expiry_date' => ['sometimes', 'nullable', 'date'],
            'shelf_life_days' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'note' => ['sometimes', 'nullable', 'string', 'max:255'],
            'source' => ['sometimes', 'nullable', 'string', 'in:manual,barcode,receipt,photo,voice'],
        ]);

        $item->update($data);

        return new ItemResource($item->load('product'));
    }

    public function destroy(Request $request, Item $item)
    {
        $this->authorize('delete', $item);

        $item->delete();

        return response()->noContent();
    }
}
