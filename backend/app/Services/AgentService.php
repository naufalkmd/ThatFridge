<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AgentService
{
    protected $apiKey;
    protected $baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = env('OPENROUTER_API_KEY');
    }

    /**
     * Send message to agent and get response
     */
    public function chat($message, $agent = 'Chef', $inventory = null, $usageHistory = null)
    {
        // Mock response if no API key (for testing)
        if (!$this->apiKey) {
            return $this->mockResponse($message, $agent, $inventory);
        }

        try {
            $systemPrompt = $this->getSystemPrompt($agent, $inventory, $usageHistory);
            
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'HTTP-Referer' => env('APP_URL'),
                'X-Title' => 'ThatFridge',
            ])->post($this->baseUrl, [
                'model' => 'anthropic/claude-haiku-4.5',
                'max_tokens' => 1000,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $systemPrompt
                    ],
                    [
                        'role' => 'user',
                        'content' => $message
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $agentResponse = $data['choices'][0]['message']['content'] ?? 'No response';
                
                return [
                    'agent' => $agent,
                    'user_message' => $message,
                    'agent_response' => $agentResponse,
                    'status' => 'success',
                ];
            }

            Log::error('OpenRouter API error', ['status' => $response->status(), 'body' => $response->body()]);
            return null;
        } catch (\Exception $e) {
            Log::error('Agent chat failed', ['agent' => $agent, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Mock response when API key is not set (for testing)
     */
    private function mockResponse($message, $agent, $inventory = null)
    {
        $mockResponses = [
            'Chef' => "I'd suggest making a delicious meal! With the current inventory, you could prepare something tasty and use items expiring soon.",
            'Guardian' => "Keep an eye on items expiring in the next 3-5 days. Store soft items in the fridge and frozen items in the freezer for best results.",
            'Organizer' => "Store fresh produce in the vegetable crisper, dairy on middle shelves, and frozen items in the freezer for optimal organization.",
            'Shopkeeper' => "Consider restocking dairy, fresh vegetables, and pantry staples. Check expiration dates before your next shopping trip!",
        ];

        return [
            'agent' => $agent,
            'user_message' => $message,
            'agent_response' => $mockResponses[$agent] ?? $mockResponses['Chef'],
            'status' => 'success',
        ];
    }

    /**
     * Get system prompt based on agent type
     */
    private function getSystemPrompt($agent, $inventory = null, $usageHistory = null)
    {
        $inventoryContext = $inventory ? "\n\nCurrent inventory:\n" . $inventory : '';
        // This is what makes the "AI Data & Memory" screen's "Shopkeeper remembers items you
        // use often" claim actually true, rather than a locally-displayed list nothing ever
        // reads - the model genuinely sees past usage and can reason about it (most relevant
        // to Shopkeeper's restocking suggestions, but harmless context for the others too).
        $usageContext = $usageHistory ? "\n\nItems the user has used up often in the past (frequency = how often, most-used first):\n" . $usageHistory : '';

        $prompts = [
            'Chef' => "You are Chef. Your role is to suggest recipes and meals based on available ingredients. Prioritize items that are expiring soon. Be enthusiastic about cooking! Keep responses concise (2-3 sentences)." . $inventoryContext . $usageContext,

            'Guardian' => "You are Guardian. Your role is to alert about food safety issues and spoilage. Flag items that are expired or close to expiring. Warn about risky storage. Be direct and clear about safety concerns. Keep responses concise (2-3 sentences)." . $inventoryContext . $usageContext,

            'Organizer' => "You are Organizer. Your role is to suggest optimal storage locations for items (fridge, freezer, pantry). Explain why each storage location is best for that food. Help maintain an organized fridge. Keep responses concise (2-3 sentences)." . $inventoryContext . $usageContext,

            'Shopkeeper' => "You are Shopkeeper. Your role is to recommend items to buy based on what's running low in inventory and what the user tends to buy again. Suggest quantities. Consider meal planning needs. Keep responses concise (2-3 sentences)." . $inventoryContext . $usageContext,
        ];

        return $prompts[$agent] ?? $prompts['Chef'];
    }

    /**
     * Get all agent names
     */
    public function getAgents()
    {
        return ['Chef', 'Guardian', 'Organizer', 'Shopkeeper'];
    }

    /**
     * Suggest a shelf life and storage location for an item by name, for the Add-item
     * form's "Auto-fill" button. Previously this button just ran a static lookup table
     * client-side (icon -> hardcoded days, keyword -> location) with no AI involved
     * despite the sparkle-icon styling implying otherwise; this asks the model instead,
     * falling back to that same lookup table when no API key is configured or the call
     * fails, so the feature still works offline/in local dev.
     */
    public function suggestItemDetails(string $name, ?string $icon = null): array
    {
        if (! $this->apiKey) {
            return $this->fallbackItemSuggestion($name, $icon);
        }

        try {
            $prompt = <<<PROMPT
You are estimating storage details for a single grocery item a home cook is adding to their kitchen inventory tracker.

Item name: "{$name}"

Return ONLY a JSON object (no prose, no markdown fences) with exactly these fields:
- "shelf_life_days": typical shelf life in days from today if stored properly (integer, 1-365)
- "location": the best place to store it - one of "fridge", "freezer", "pantry"
PROMPT;

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'HTTP-Referer' => env('APP_URL'),
                'X-Title' => 'ThatFridge',
            ])->post($this->baseUrl, [
                'model' => 'anthropic/claude-haiku-4.5',
                'max_tokens' => 100,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                $parsed = $this->parseJsonObject($content);

                if ($parsed && isset($parsed['shelf_life_days'], $parsed['location'])) {
                    return [
                        'shelf_life_days' => max(1, min(365, (int) $parsed['shelf_life_days'])),
                        'location' => in_array($parsed['location'], ['fridge', 'freezer', 'pantry'], true)
                            ? $parsed['location']
                            : 'fridge',
                    ];
                }
            }

            Log::error('OpenRouter item-suggestion error', ['status' => $response->status(), 'body' => $response->body()]);
        } catch (\Exception $e) {
            Log::error('Item suggestion failed', ['name' => $name, 'error' => $e->getMessage()]);
        }

        return $this->fallbackItemSuggestion($name, $icon);
    }

    /**
     * The model is asked for raw JSON but occasionally wraps it in markdown fences anyway;
     * strip those defensively before decoding.
     */
    private function parseJsonObject(?string $content): ?array
    {
        if (! $content) {
            return null;
        }

        $content = trim(preg_replace('/^```(?:json)?|```$/m', '', trim($content)));
        $data = json_decode($content, true);

        return is_array($data) ? $data : null;
    }

    /**
     * Same lookup table the frontend used to run standalone (data.ts's
     * DEFAULT_SHELF_LIFE_DAYS / guessLocation) - kept here only as the offline/no-key
     * fallback so the button still does something reasonable without a live model call.
     */
    private function fallbackItemSuggestion(string $name, ?string $icon): array
    {
        $defaultShelfLifeDays = [
            'milk' => 7,
            'yogurt' => 14,
            'cheese' => 21,
            'eggs' => 21,
            'spinach' => 5,
            'carrot' => 14,
            'apple' => 14,
            'berries' => 5,
            'meat' => 3,
            'leftovers' => 4,
        ];

        $freezerKeywords = ['frozen', 'ice cream', 'popsicle', 'gelato', 'freezer'];
        $pantryKeywords = ['can of', 'canned', 'pasta', 'rice', 'cereal', 'cracker', 'chips', 'flour', 'sugar', 'bread', 'jar', 'sauce', 'oil', 'vinegar', 'beans', 'noodle', 'granola', 'nuts'];

        $query = strtolower(trim($name));
        $location = 'fridge';
        foreach ($freezerKeywords as $keyword) {
            if (str_contains($query, $keyword)) {
                $location = 'freezer';
                break;
            }
        }
        if ($location === 'fridge') {
            foreach ($pantryKeywords as $keyword) {
                if (str_contains($query, $keyword)) {
                    $location = 'pantry';
                    break;
                }
            }
        }

        return [
            'shelf_life_days' => $defaultShelfLifeDays[$icon] ?? 7,
            'location' => $location,
        ];
    }
}