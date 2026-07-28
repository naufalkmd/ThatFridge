<?php

namespace App\Http\Controllers;

use App\Http\Resources\SectionResource;
use App\Models\Fridge;
use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function store(Request $request, Fridge $fridge)
    {
        $this->authorize('update', $fridge);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ]);

        $section = $fridge->sections()->create($data);

        return new SectionResource($section->load('items.product'));
    }

    public function update(Request $request, Section $section)
    {
        $this->authorize('update', $section);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ]);

        $section->update($data);

        return new SectionResource($section->load('items.product'));
    }

    public function destroy(Request $request, Section $section)
    {
        $this->authorize('delete', $section);

        $section->delete();

        return response()->noContent();
    }
}
