<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PhotoService
{
    /**
     * Process fridge photo and mock object detection
     */
    public function processPhoto($file)
    {
        try {
            // Save file to storage
            $path = $file->store('photos', 'public');
            
            // Mock detection response (in real version, call Gemini Vision here)
            $detectedItems = $this->mockDetection();
            
            return [
                'photo_scan_id' => rand(1, 100000),
                'file_path' => $path,
                'file_url' => Storage::url($path),
                'status' => 'processed',
                'detected_items' => $detectedItems,
            ];
        } catch (\Exception $e) {
            Log::error('Photo processing failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Mock object detection response (replace with real Gemini Vision call later)
     */
    private function mockDetection()
    {
        return [
            [
                'detected_name' => 'milk bottle',
                'parsed_name' => 'Milk',
                'icon' => 'milk',
                'matched_product_id' => null,
                'confidence' => 0.95,
                'confirmed' => false,
            ],
            [
                'detected_name' => 'yogurt container',
                'parsed_name' => 'Yogurt',
                'icon' => 'yogurt',
                'matched_product_id' => null,
                'confidence' => 0.88,
                'confirmed' => false,
            ],
            [
                'detected_name' => 'cheese package',
                'parsed_name' => 'Cheese',
                'icon' => 'cheese',
                'matched_product_id' => null,
                'confidence' => 0.82,
                'confirmed' => false,
            ],
            [
                'detected_name' => 'bread loaf',
                'parsed_name' => 'Bread',
                'icon' => 'bread',
                'matched_product_id' => null,
                'confidence' => 0.90,
                'confirmed' => false,
            ],
        ];
    }

    /**
     * Confirm and prepare detected items for import
     */
    public function confirmItems($items)
    {
        return collect($items)
            ->filter(fn($item) => $item['confirmed'] ?? false)
            ->map(function ($item) {
                return [
                    'name' => $item['name'] ?? $item['parsed_name'],
                    'icon' => $item['icon'] ?? 'item',
                    'location' => $item['location'] ?? 'fridge',
                    'quantity' => $item['quantity'] ?? 1,
                    'expiry_date' => $item['expiry_date'] ?? now()->addDays(14)->toDateString(),
                    'shelf_life_days' => $item['shelf_life_days'] ?? 14,
                    'source' => 'photo',
                ];
            })
            ->toArray();
    }
}