<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BarcodeService
{
    /**
     * Lookup product info by barcode, preferring our local cache over
     * Open Food Facts (product data barely changes once scanned).
     */
    public function lookup($barcode)
    {
        $cached = Product::where('barcode', $barcode)->first();

        if ($cached) {
            return [
                'name' => $cached->name,
                'category' => $cached->category,
                'barcode' => $cached->barcode,
                'icon' => $cached->icon,
                'default_shelf_life_days' => $cached->default_shelf_life_days,
                'image_url' => $cached->image_url,
            ];
        }

        try {
            $response = Http::get("https://world.openfoodfacts.org/api/v0/product/{$barcode}.json");

            if ($response->status() === 200) {
                $data = $response->json();
                $product = $this->parseResponse($data);

                if ($product && $product['barcode']) {
                    Product::updateOrCreate(['barcode' => $product['barcode']], $product);
                }

                return $product;
            }

            return null; // Barcode not found
        } catch (\Exception $e) {
            Log::error('Barcode lookup failed', ['barcode' => $barcode, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Parse Open Food Facts response into our format
     */
    private function parseResponse($data)
    {
        $product = $data['product'] ?? null;
        
        if (!$product) {
            return null;
        }

        return [
            'name' => $product['product_name'] ?? 'Unknown Product',
            'category' => $product['categories'] ?? null,
            'barcode' => $product['code'] ?? null,
            'icon' => $this->getIconFromCategory($product['categories'] ?? null),
            'default_shelf_life_days' => $this->estimateShelfLife($product),
            'image_url' => $product['image_url'] ?? null,
        ];
    }

    /**
     * Estimate shelf life based on product type
     */
    private function estimateShelfLife($product)
    {
        $categories = strtolower($product['categories'] ?? '');
        
        if (strpos($categories, 'dairy') !== false) return 14;
        if (strpos($categories, 'meat') !== false) return 7;
        if (strpos($categories, 'beverage') !== false) return 365;
        if (strpos($categories, 'vegetable') !== false) return 14;
        if (strpos($categories, 'fruit') !== false) return 10;
        
        return 30;
    }

    /**
     * Map category to icon key (must match frontend)
     */
    private function getIconFromCategory($category)
    {
        if (!$category) return 'item';
        
        $category = strtolower($category);
        
        $icons = [
            'dairy' => 'milk',
            'milk' => 'milk',
            'cheese' => 'cheese',
            'yogurt' => 'yogurt',
            'meat' => 'meat',
            'chicken' => 'chicken',
            'vegetable' => 'vegetable',
            'fruit' => 'fruit',
            'bread' => 'bread',
            'beverage' => 'drink',
            'juice' => 'drink',
            'condiment' => 'condiment',
        ];

        foreach ($icons as $keyword => $icon) {
            if (strpos($category, $keyword) !== false) {
                return $icon;
            }
        }

        return 'item';
    }
}