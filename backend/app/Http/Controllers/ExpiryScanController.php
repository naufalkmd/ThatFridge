<?php

namespace App\Http\Controllers;

use App\Services\ExpiryScanService;
use Illuminate\Http\Request;

class ExpiryScanController extends Controller
{
    protected $expiryScanService;

    public function __construct(ExpiryScanService $expiryScanService)
    {
        $this->expiryScanService = $expiryScanService;
    }

    /**
     * Read the printed expiry date off a package photo.
     */
    public function scan(Request $request, $section)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        $result = $this->expiryScanService->extractDate($request->file('image'));

        if (!$result['found']) {
            return response()->json([
                'found' => false,
                'message' => 'Could not read a date on that photo. Try a closer, well-lit shot, or enter it manually.',
            ], 200);
        }

        return response()->json([
            'found' => true,
            'date' => $result['date'],
            'raw_text' => $result['raw_text'],
            'confidence' => $result['confidence'],
            'message' => 'Review the date, then confirm.',
        ], 200);
    }
}
