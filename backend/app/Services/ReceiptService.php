<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ReceiptService
{
    /**
     * Process receipt image upload and mock OCR
     */
    public function processReceipt($file, $storeName = null, $purchasedAt = null)
    {
        try {
            // Save file to storage
            $path = $file->store('receipts', 'public');
            
            // Mock OCR response (in real version, call Gemini Vision here)
            $detectedItems = $this->mockOCR();
            
            return [
                'receipt_id' => rand(1, 100000),
                'file_path' => $path,
                'file_url' => Storage::url($path),
                'store_name' => $storeName,
                'purchased_at' => $purchasedAt ?? now()->toDateString(),
                'status' => 'processed',
                'detected_items' => $detectedItems,
            ];
        } catch (\Exception $e) {
            Log::error('Receipt processing failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Mock OCR response (replace with real Gemini Vision call later)
     */
    private function mockOCR()
    {
        return [
            [
                'raw_text' => 'Milk 2L x 1',
                'parsed_name' => 'Milk',
                'parsed_quantity' => 1,
                'matched_product_id' => null,
                'icon' => 'milk',
                'confirmed' => false,
            ],
            [
                'raw_text' => 'Cheese 200g x 2',
                'parsed_name' => 'Cheese',
                'parsed_quantity' => 2,
                'matched_product_id' => null,
                'icon' => 'cheese',
                'confirmed' => false,
            ],
            [
                'raw_text' => 'Bread x 1',
                'parsed_name' => 'Bread',
                'parsed_quantity' => 1,
                'matched_product_id' => null,
                'icon' => 'bread',
                'confirmed' => false,
            ],
        ];
    }

    /**
     * Confirm and prepare items for import
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
                    'quantity' => $item['quantity'] ?? $item['parsed_quantity'] ?? 1,
                    'expiry_date' => $item['expiry_date'] ?? now()->addDays(14)->toDateString(),
                    'shelf_life_days' => $item['shelf_life_days'] ?? 14,
                    'source' => 'receipt',
                ];
            })
            ->toArray();
    }
}