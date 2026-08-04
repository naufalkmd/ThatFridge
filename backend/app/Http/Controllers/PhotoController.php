<?php

namespace App\Http\Controllers;

use App\Models\Section;
use App\Services\PhotoService;
use Illuminate\Http\Request;

class PhotoController extends Controller
{
    protected $photoService;

    public function __construct(PhotoService $photoService)
    {
        $this->photoService = $photoService;
    }

    /**
     * Upload fridge photo and detect items
     */
    public function scan(Request $request, Section $section)
    {
        $this->authorize('update', $section);

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        $result = $this->photoService->processPhoto($request->file('image'));

        if (!$result) {
            return response()->json(['error' => 'Failed to process photo'], 500);
        }

        return response()->json([
            'photo_scan_id' => $result['photo_scan_id'],
            'status' => $result['status'],
            'file_url' => $result['file_url'],
            'detected_items' => $result['detected_items'],
            'message' => 'Review detected items, then confirm to add',
        ], 200);
    }

    /**
     * Confirm photo detections and prepare for import
     */
    public function confirm(Request $request, Section $section)
    {
        $this->authorize('update', $section);

        $request->validate([
            'photo_scan_id' => 'required|integer',
            'items' => 'required|array',
            'items.*.name' => 'required|string',
            'items.*.icon' => 'required|string',
            'items.*.location' => 'required|in:fridge,freezer,pantry',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.expiry_date' => 'required|date_format:Y-m-d',
            'items.*.shelf_life_days' => 'nullable|integer|min:1',
            'items.*.confirmed' => 'required|boolean',
        ]);

        $confirmedItems = $this->photoService->confirmItems($request->input('items'));

        if (empty($confirmedItems)) {
            return response()->json(['error' => 'No items confirmed'], 400);
        }

        // Mock: would call Track A's POST /api/sections/{section}/items for each item
        return response()->json([
            'photo_scan_id' => $request->input('photo_scan_id'),
            'status' => 'imported',
            'created_items' => $confirmedItems,
            'message' => count($confirmedItems) . ' items added to inventory',
        ], 201);
    }
}