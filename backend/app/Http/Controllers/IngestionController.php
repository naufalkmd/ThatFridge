<?php

namespace App\Http\Controllers;

use App\Models\Section;
use Illuminate\Http\Request;

class IngestionController extends Controller
{
    /**
     * Manual item entry - Track B endpoint
     */
    public function store(Request $request, Section $section)
    {
        $this->authorize('update', $section);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'required|string|max:50',
            'location' => 'required|in:fridge,freezer,pantry',
            'quantity' => 'required|integer|min:1',
            'expiry_date' => 'required|date_format:Y-m-d',
            'shelf_life_days' => 'nullable|integer|min:1',
            'note' => 'nullable|string|max:500',
        ]);

        $validated['source'] = 'manual';
        $validated['product_id'] = null;

        // MOCK RESPONSE - Until Track A's endpoint exists
        return response()->json([
            'id' => rand(1, 10000),
            'section_id' => null, // Section ID is not provided in this endpoint
            'product_id' => null,
            'name' => $validated['name'],
            'icon' => $validated['icon'],
            'location' => $validated['location'],
            'quantity' => $validated['quantity'],
            'expiry_date' => $validated['expiry_date'],
            'shelf_life_days' => $validated['shelf_life_days'] ?? 18,
            'freshness_pct' => 85,
            'days_left' => 18,
            'note' => $validated['note'] ?? null,
            'source' => 'manual',
            'created_at' => now()->toIso8601String(),
        ], 201);
    }
}