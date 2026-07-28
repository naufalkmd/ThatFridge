<?php

namespace App\Http\Controllers;

use App\Http\Resources\ShoppingItemResource;
use App\Models\ShoppingItem;
use Illuminate\Http\Request;

class ShoppingItemController extends Controller
{
    public function index(Request $request)
    {
        return ShoppingItemResource::collection($request->user()->shoppingItems()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:255'],
            'section' => ['required', 'string', 'max:255'],
            'checked' => ['sometimes', 'boolean'],
        ]);

        $data['checked'] ??= false;

        $shoppingItem = $request->user()->shoppingItems()->create($data);

        return new ShoppingItemResource($shoppingItem);
    }

    public function update(Request $request, ShoppingItem $shoppingItem)
    {
        $this->authorize('update', $shoppingItem);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:255'],
            'section' => ['sometimes', 'string', 'max:255'],
            'checked' => ['sometimes', 'boolean'],
        ]);

        $shoppingItem->update($data);

        return new ShoppingItemResource($shoppingItem);
    }

    public function destroy(Request $request, ShoppingItem $shoppingItem)
    {
        $this->authorize('delete', $shoppingItem);

        $shoppingItem->delete();

        return response()->noContent();
    }
}
